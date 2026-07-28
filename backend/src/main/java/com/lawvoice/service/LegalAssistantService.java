package com.lawvoice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lawvoice.dto.AskRequest;
import com.lawvoice.dto.AskResponse;
import com.lawvoice.dto.EmergencyItem;
import com.lawvoice.dto.FaqItem;
import com.lawvoice.dto.LawyerItem;
import com.lawvoice.model.QueryHistory;
import com.lawvoice.repository.QueryHistoryRepository;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import com.lawvoice.model.UserAccount;
import com.lawvoice.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class LegalAssistantService {
    private final QueryHistoryRepository historyRepository;
    private final PdfKnowledgeService pdfKnowledgeService;
    private final UserAccountRepository userAccountRepository;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String sarvamApiKey;
    private final String sarvamModel;
    private volatile String lastSarvamError = "";

    public LegalAssistantService(
            QueryHistoryRepository historyRepository,
            PdfKnowledgeService pdfKnowledgeService,
            UserAccountRepository userAccountRepository,
            @Value("${SARVAM_API_KEY:${sarvam.api.key:}}") String sarvamApiKey,
            @Value("${SARVAM_MODEL:${sarvam.model:sarvam-105b}}") String sarvamModel
    ) {
        this.historyRepository = historyRepository;
        this.pdfKnowledgeService = pdfKnowledgeService;
        this.userAccountRepository = userAccountRepository;
        this.sarvamApiKey = sarvamApiKey;
        this.sarvamModel = sarvamModel;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(12))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public AskResponse answer(AskRequest request) {
        SarvamCall sarvamCall = answerWithSarvam(request);
        AskResponse response = sarvamCall.response();
        if (response == null) {
            response = localCaseAnswer(request.query(), sarvamCall.error());
        }
        response = enrichWithLawyersAndSources(request.query(), response);
        saveHistory(request, response);
        return response;
    }

    public Map<String, Object> aiStatus() {
        Map<String, Object> status = new java.util.LinkedHashMap<>();
        status.put("provider", "Sarvam AI");
        status.put("configured", true);
        status.put("sarvamConfigured", sarvamApiKey != null && !sarvamApiKey.isBlank());
        status.put("model", sarvamModel);
        status.put("fallback", "Tamil local legal classifier");
        status.put("classifierVersion", "direct-v2");
        status.put("lastError", lastSarvamError == null ? "" : lastSarvamError);
        return status;
    }

    private SarvamCall answerWithSarvam(AskRequest request) {
        if (sarvamApiKey == null || sarvamApiKey.isBlank()) {
            lastSarvamError = "SARVAM_API_KEY is missing in backend environment.";
            return new SarvamCall(null, lastSarvamError);
        }

        String systemPrompt = """
                You are a Tamil-speaking Indian legal case assistant for LawVoice.
                Respond like a practical advocate's assistant: understand the exact facts, identify the likely legal issue, explain the legal route, and give a concrete action plan.
                Always answer ONLY in natural Tamil. Never answer in English.
                Do not give generic repeated template answers. Every field must mention facts from the user's query when facts are available.
                If facts are missing, still give the best immediate plan and list the exact facts/documents the user must collect.
                You may draft a complaint, notice, police representation, consumer complaint paragraph, or message template inside steps or nextActions when useful.
                Do not claim to be a licensed lawyer, do not promise success, and do not replace professional legal advice.
                Emergency guidance: immediate danger -> 112; women's safety/domestic violence -> 181 and 112 if urgent; cyber financial fraud -> 1930 and cybercrime.gov.in; consumer complaint -> 1915.
                Return ONLY valid JSON. No markdown. No code fences.
                Required JSON shape:
                {
                  "topic": "short Tamil title",
                  "category": "one of: Criminal Law, Family Law, Consumer Law, Property Law, Cyber Crime, Labour Law, General",
                  "summary": "direct Tamil case analysis in 3-5 sentences, specific to the user's facts",
                  "steps": ["specific action step 1", "specific action step 2", "specific action step 3", "specific action step 4"],
                  "rights": ["specific right/protection relevant to this case", "another relevant right"],
                  "nextActions": ["what to do today", "which authority/platform/lawyer type to approach", "what to write/send next"],
                  "disclaimer": "இது பொதுவான சட்ட விழிப்புணர்வு மட்டுமே; குறிப்பிட்ட வழக்குக்கு தகுதியான வழக்கறிஞரிடம் ஆலோசனை பெறுங்கள்."
                }
                """;

        // Build user message
        String userContent = "User legal question (Tamil answer only): " + request.query();

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userContent));

        Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("model", sarvamModel);
        payload.put("temperature", 0.05);
        payload.put("max_tokens", 1600);
        payload.put("messages", messages);

        try {
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.sarvam.ai/v1/chat/completions"))
                    .timeout(Duration.ofSeconds(40))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + sarvamApiKey)
                    .header("api-subscription-key", sarvamApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString(java.nio.charset.StandardCharsets.UTF_8));
            if (httpResponse.statusCode() < 200 || httpResponse.statusCode() >= 300) {
                lastSarvamError = "Sarvam API returned HTTP " + httpResponse.statusCode() + ": " + trimForUi(httpResponse.body());
                return new SarvamCall(null, lastSarvamError);
            }

            JsonNode root = objectMapper.readTree(httpResponse.body());
            String content = root.path("choices").path(0).path("message").path("content").asText("");
            AskResponse parsed = parseSarvamAnswer(content);
            lastSarvamError = "";
            return new SarvamCall(parsed, "");
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            lastSarvamError = ex.getClass().getSimpleName() + ": " + ex.getMessage();
            return new SarvamCall(null, lastSarvamError);
        }
    }

    private AskResponse parseSarvamAnswer(String content) throws JsonProcessingException {
        String json = content.trim()
                .replaceFirst("^```json\\s*", "")
                .replaceFirst("^```\\s*", "")
                .replaceFirst("\\s*```$", "");
        Map<String, Object> value = objectMapper.readValue(json, new TypeReference<>() {});
        return new AskResponse(
                stringValue(value.get("topic"), "சட்ட வழிகாட்டல்"),
                normalizeCategory(stringValue(value.get("category"), "General")),
                stringValue(value.get("summary"), "உங்கள் கேள்விக்கான சட்ட வழிகாட்டல் கீழே கொடுக்கப்பட்டுள்ளது."),
                stringList(value.get("steps")),
                stringList(value.get("rights")),
                stringList(value.get("nextActions")),
                List.of(),
                List.of(),
                stringValue(value.get("disclaimer"), "இது பொதுவான சட்ட விழிப்புணர்வு மட்டுமே; குறிப்பிட்ட வழக்குக்கு வழக்கறிஞரிடம் ஆலோசனை பெறுங்கள்.")
        );
    }

    private AskResponse aiUnavailableResponse(String reason) {
        return new AskResponse(
                "Sarvam AI இணைக்கப்படவில்லை",
                "General",
                "வழக்கறிஞர் போல் கேள்விக்கேற்ப பதில் தர இந்த பக்கத்திற்கு Sarvam AI தேவை. இப்போது இணைப்பு தோல்வியடைந்தது. காரணம்: " + safeReason(reason),
                List.of(
                        "Backend terminal-ல் SARVAM_API_KEY சரியாக set செய்யுங்கள்.",
                        "Frontend port 6000/6001 என்றால் FRONTEND_ORIGIN அதற்கேற்ப set செய்யுங்கள்.",
                        "Backend-ஐ restart செய்த பிறகு மீண்டும் அதே கேள்வியை கேளுங்கள்.",
                        "உடனடி ஆபத்து இருந்தால் 112 அழைக்கவும்; சைபர் நிதி மோசடி என்றால் 1930 அழைக்கவும்."
                ),
                List.of("தவறான அல்லது generic சட்ட பதிலை நம்ப வேண்டாம்."),
                List.of("Sarvam key அமைந்த பிறகு இந்த பக்கம் கேள்விக்கேற்ப தனிப்பட்ட செயல் திட்டம் தரும்."),
                List.of(),
                List.of(),
                "AI சேவை இணைக்கப்படாததால் சட்ட வழிகாட்டல் உருவாக்கப்படவில்லை."
        );
    }

    private String safeReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return "Unknown Sarvam/API error.";
        }
        return trimForUi(reason.replaceAll("sk_[A-Za-z0-9_\\-]+", "sk_***"));
    }

    private String trimForUi(String text) {
        if (text == null) {
            return "";
        }
        return text.length() > 300 ? text.substring(0, 300) + "..." : text;
    }

    private AskResponse localCaseAnswer(String query, String aiError) {
        String text = query == null ? "" : query.toLowerCase(Locale.ROOT);
        AskResponse response;
        if (text.contains("upi") || text.contains("otp") || text.contains("fraud") || text.contains("cyber")
                || hasAny(text, "சைபர்", "இணைய", "ஆன்லைன்", "மோசடி", "ஹேக்")) {
            response = new AskResponse(
                    "இணைய பண மோசடி / சைபர் புகார்",
                    "Cyber Crime",
                    "உங்கள் கேள்வி இணையம் அல்லது பண மோசடி தொடர்பானதாக தெரிகிறது. இதில் நேரம் மிகவும் முக்கியம்; பணம் சென்றிருந்தால் முதலில் வங்கி/UPI சேவையிடம் பரிவர்த்தனையை முடக்க கோர வேண்டும். அதே நேரத்தில் 1930 உதவி எண் அல்லது cybercrime.gov.in வழியாக புகார் அளிக்க வேண்டும்.",
                    List.of(
                            "பரிவர்த்தனை எண், தேதி, நேரம், UPI ID/மொபைல் எண், வங்கி செய்தி, ஸ்கிரீன்ஷாட் ஆகியவற்றை அழிக்காமல் சேமியுங்கள்.",
                            "உடனே உங்கள் வங்கி அல்லது UPI செயலியின் customer support-ஐ தொடர்பு கொண்டு dispute/block request பதிவு செய்யுங்கள்.",
                            "1930 எண்ணை அழைக்கவும் அல்லது cybercrime.gov.in தளத்தில் புகார் அளித்து acknowledgement number சேமிக்கவும்.",
                            "கடவுச்சொல் மாற்றி, இரண்டு நிலை பாதுகாப்பை இயக்கி, சந்தேகமான app/link-களை நீக்குங்கள்."
                    ),
                    List.of(
                            "சைபர் குற்ற புகார் அளிக்க உங்களுக்கு உரிமை உள்ளது.",
                            "வங்கி/சேவை வழங்குநரிடம் பரிவர்த்தனை விவரம் மற்றும் புகார் எண் கேட்கலாம்."
                    ),
                    List.of(
                            "இன்றே 1930 அல்லது cybercrime.gov.in மூலம் புகார் பதிவு செய்யுங்கள்.",
                            "பணம் அதிகமாக இழந்திருந்தால் சைபர் குற்ற வழக்கறிஞர் அல்லது அருகிலுள்ள காவல் நிலையத்தை அணுகுங்கள்.",
                            "புகாரில் தொகை, நேரம், கணக்கு/UPI விவரம், சந்தேக நபர் விவரம் ஆகியவற்றை தெளிவாக எழுதுங்கள்."
                    ),
                    List.of(),
                    List.of(),
                    disclaimer(aiError)
            );
            return response;
        }
        if (text.contains("domestic") || text.contains("violence")
                || hasAny(text, "குடும்ப", "மனைவி", "கணவர்", "விவாகரத்து", "பராமரிப்பு", "குழந்தை காவல்", "181")) {
            response = new AskResponse(
                    "குடும்ப சட்டம் / பாதுகாப்பு",
                    "Family Law",
                    "உங்கள் கேள்வி குடும்ப பிரச்சினை அல்லது பாதுகாப்பு தொடர்பானதாக தெரிகிறது. முதலில் உடனடி பாதுகாப்பு, பிறகு ஆதாரம், அதன் பிறகு உரிய சட்ட நிவாரணம் என்ற வரிசையில் செயல்படுவது நல்லது. வன்முறை அல்லது மிரட்டல் இருந்தால் 112 அல்லது பெண்கள் உதவி எண் 181-ஐ உடனே பயன்படுத்தலாம்.",
                    List.of(
                            "உடனடி ஆபத்து இருந்தால் பாதுகாப்பான இடத்துக்கு சென்று 112 அல்லது 181 அழைக்கவும்.",
                            "மிரட்டல் செய்தி, மருத்துவ பதிவு, புகைப்படம், செலவு ஆதாரம், குழந்தை தொடர்பான ஆவணங்கள் ஆகியவற்றை சேமியுங்கள்.",
                            "நிகழ்வுகளை தேதி வாரியாக, யார் என்ன செய்தார் என்று தெளிவாக எழுதுங்கள்.",
                            "பாதுகாப்பு உத்தரவு, பராமரிப்பு தொகை, குழந்தை காவல் போன்ற நிவாரணங்களுக்கு குடும்ப சட்ட வழக்கறிஞரை அணுகுங்கள்."
                    ),
                    List.of(
                            "உடல், மன, பொருளாதார அல்லது வாய்வழி வன்முறையிலிருந்து பாதுகாப்பு கோரலாம்.",
                            "தகுந்த சூழலில் பராமரிப்பு தொகை மற்றும் குடியிருப்பு பாதுகாப்பு கோரலாம்."
                    ),
                    List.of(
                            "இன்று உங்கள் பாதுகாப்புத் திட்டத்தை நம்பகமான ஒருவருடன் பகிருங்கள்.",
                            "ஆவணங்கள் இருந்தால் குடும்ப நீதிமன்றம்/சட்ட உதவி மையம்/குடும்ப சட்ட வழக்கறிஞரை அணுகுங்கள்.",
                            "புகார் எழுதும்போது சம்பவ தேதி, இடம், சாட்சி, ஆதாரம் ஆகியவற்றை சேர்க்கவும்."
                    ),
                    List.of(),
                    List.of(),
                    disclaimer(aiError)
            );
            return response;
        }
        if (text.contains("refund") || text.contains("product") || text.contains("service") || text.contains("bill")
                || hasAny(text, "நுகர்வோர்", "பணத்திருப்பு", "பொருள்", "வாரண்டி", "பில்")) {
            response = new AskResponse(
                    "நுகர்வோர் புகார் / பணத்திருப்பு",
                    "Consumer Law",
                    "உங்கள் கேள்வி பொருள், சேவை, refund அல்லது warranty தொடர்பான நுகர்வோர் பிரச்சினையாக தெரிகிறது. முதலில் விற்பனையாளர் அல்லது சேவை வழங்குநருக்கு ஆதாரத்துடன் எழுத்துப்பூர்வ புகார் அனுப்ப வேண்டும். தீர்வு கிடைக்கவில்லை என்றால் 1915 அல்லது அதிகாரப்பூர்வ நுகர்வோர் புகார் தளத்தை பயன்படுத்தலாம்.",
                    List.of(
                            "பில், order number, payment receipt, warranty, chat/email பதிவு, பொருள் புகைப்படம் ஆகியவற்றை சேமியுங்கள்.",
                            "என்ன குறை, நீங்கள் கேட்கும் தீர்வு என்ன (refund/replacement/repair/compensation) என்று தெளிவாக எழுதுங்கள்.",
                            "விற்பனையாளர் பதில் அளிக்கவில்லை என்றால் 1915 அல்லது நுகர்வோர் புகார் தளத்தில் புகார் அளிக்கவும்.",
                            "பெரிய தொகை அல்லது நிறுவனம் மறுப்பு இருந்தால் நுகர்வோர் சட்ட வழக்கறிஞரை அணுகுங்கள்."
                    ),
                    List.of(
                            "தரமான பொருள் மற்றும் சேவை பெற நுகர்வோருக்கு உரிமை உள்ளது.",
                            "குறை நிரூபிக்கப்பட்டால் refund, replacement, repair அல்லது compensation கேட்கலாம்."
                    ),
                    List.of(
                            "இன்றே ஆதாரங்களுடன் ஒரு எழுத்துப்பூர்வ complaint message/email அனுப்புங்கள்.",
                            "பதில் வராத காலவரையையும் புகார் எண்ணையும் பதிவு செய்து வையுங்கள்.",
                            "புகாரில் பில் எண், வாங்கிய தேதி, குறை, கோரிக்கை ஆகியவற்றை சேர்க்கவும்."
                    ),
                    List.of(),
                    List.of(),
                    disclaimer(aiError)
            );
            return response;
        }
        if (text.contains("tenant") || text.contains("landlord") || text.contains("rental")
                || hasAny(text, "வாடகை", "முன்பணம்", "நிலம்", "சொத்து", "பத்திரம்")) {
            response = new AskResponse(
                    "சொத்து / வாடகை / நில ஆவணம்",
                    "Property Law",
                    "உங்கள் கேள்வி சொத்து, நிலம் அல்லது வாடகை தொடர்பானதாக தெரிகிறது. இவ்வகை பிரச்சினைகளில் ஒப்பந்தம், பண பரிவர்த்தனை ஆதாரம், உரிமை ஆவணம் ஆகியவை முக்கியம். வாய்மொழி பேச்சை மட்டும் நம்பாமல் எல்லா கோரிக்கைகளையும் எழுத்தில் பதிவு செய்யுங்கள்.",
                    List.of(
                            "வாடகை ஒப்பந்தம், ரசீது, வங்கி பரிவர்த்தனை, உரிமை ஆவணம், வரி ரசீது ஆகியவற்றை ஒரே கோப்பில் சேமியுங்கள்.",
                            "வீடு காலி செய்ய அழுத்தம் அல்லது முன்பணம் மறுப்பு இருந்தால் எழுத்துப்பூர்வ அறிவிப்பு கேளுங்கள்.",
                            "நிலம்/பத்திர பிரச்சினை என்றால் ஆவணங்களை வழக்கறிஞரிடம் ஆய்வு செய்ய கொடுங்கள்.",
                            "எல்லை தகராறு அல்லது உரிமை தகராறு இருந்தால் புகைப்படம், சாட்சி, வருவாய் பதிவுகள் சேகரிக்கவும்."
                    ),
                    List.of(
                            "ஒப்பந்த நிபந்தனைகளின் படி உரிய அறிவிப்பு கேட்கலாம்.",
                            "கொடுத்த பணத்திற்கான ரசீது அல்லது வங்கி ஆதாரம் வைத்திருக்கலாம்.",
                            "சொத்து ஆவணங்களை சரிபார்த்து விளக்கம் கேட்க உரிமை உள்ளது."
                    ),
                    List.of(
                            "இன்றே ஆவண நகல்களை சேகரித்து பாதுகாப்பாக வைத்துக் கொள்ளுங்கள்.",
                            "விவாதம் தொடர்ந்தால் சொத்து சட்ட வழக்கறிஞரை அணுகுங்கள்.",
                            "எழுத்துப்பூர்வ notice அனுப்பும் முன் ஒப்பந்த நிபந்தனைகளை சரிபார்க்கவும்."
                    ),
                    List.of(),
                    List.of(),
                    disclaimer(aiError)
            );
            return response;
        }
        if (text.contains("employee") || text.contains("salary") || text.contains("pf") || text.contains("esi")
                || hasAny(text, "சம்பளம்", "வேலை", "நிறுவனம்", "பணி நீக்கம்")) {
            response = new AskResponse(
                    "வேலை / சம்பளம் / தொழிலாளர் உரிமை",
                    "Labour Law",
                    "உங்கள் கேள்வி வேலை, சம்பளம் அல்லது பணி நீக்கம் தொடர்பானதாக தெரிகிறது. முதலில் நியமன ஆவணம், சம்பள ஆதாரம், மின்னஞ்சல்/செய்தி பதிவு ஆகியவற்றை சேகரிக்க வேண்டும். பிறகு HR/மேலாளரிடம் எழுத்துப்பூர்வ கோரிக்கை அனுப்பி, தீர்வு இல்லையெனில் தொழிலாளர் அலுவலகம் அல்லது வழக்கறிஞரை அணுகலாம்.",
                    List.of(
                            "நியமன கடிதம், சம்பளச் சீட்டு, வங்கி பதிவு, வருகை பதிவு, email/chat ஆதாரங்கள் சேமியுங்கள்.",
                            "நிலுவை சம்பளம் அல்லது தவறான பணி நீக்கம் குறித்து HR-க்கு எழுத்துப்பூர்வமாக கோரிக்கை அனுப்புங்கள்.",
                            "பதில் இல்லை என்றால் தொழிலாளர் அலுவலகம் அல்லது உரிய அதிகாரியிடம் புகார் செய்யலாம்.",
                            "பெரிய நிலுவை அல்லது termination dispute இருந்தால் தொழிலாளர் சட்ட வழக்கறிஞரை அணுகுங்கள்."
                    ),
                    List.of(
                            "செய்த வேலைக்கான சம்பளம் கேட்க உரிமை உள்ளது.",
                            "சம்பள விவரம், அனுபவ சான்று, சட்டப்படி கிடைக்க வேண்டிய நலன்கள் குறித்து கேட்கலாம்."
                    ),
                    List.of(
                            "இன்றே உங்கள் கோரிக்கையை email/message மூலம் எழுத்தில் அனுப்புங்கள்.",
                            "அனுப்பிய தேதி, பதில், சம்பள ஆதாரம் ஆகியவற்றை பதிவு செய்யுங்கள்.",
                            "ஆவணங்கள் பலமாக இருந்தால் வழக்கறிஞர் மூலம் notice அனுப்பலாம்."
                    ),
                    List.of(),
                    List.of(),
                    disclaimer(aiError)
            );
            return response;
        }
        if (text.contains("fir") || text.contains("police") || text.contains("theft") || text.contains("robbery")
                || text.contains("stole") || text.contains("snatch") || text.contains("csr")
                || hasAny(text, "எஃப்.ஐ.ஆர்", "காவல்", "போலீஸ்", "புகார்", "திருட", "கைப்பை", "சங்கிலி", "பறித்த", "மிரட்டல்", "தாக்குதல்")) {
            response = new AskResponse(
                    "காவல் புகார் / FIR வழிகாட்டல்",
                    "Criminal Law",
                    "உங்கள் கேள்வி காவல் புகார் அல்லது FIR தொடர்பானதாக தெரிகிறது. குற்றம் நடந்ததாக நம்பத்தகுந்த தகவல் இருந்தால் காவல் நிலையத்தில் புகார் கொடுத்து CSR/FIR எண் கேட்க வேண்டும். காவல் நிலையம் பதிவு செய்ய மறுத்தால் மேலதிகாரிக்கு எழுத்துப்பூர்வமாக அதே புகாரை அனுப்புவது அடுத்த சரியான படி.",
                    List.of(
                            "சம்பவ தேதி, நேரம், இடம், நடந்த செயல், தொடர்புடைய நபர்கள், சாட்சிகள் ஆகியவற்றை நேர வரிசையில் எழுதுங்கள்.",
                            "புகைப்படம், வீடியோ, மருத்துவ பதிவு, செய்தி, அழைப்பு பதிவு, பண பரிவர்த்தனை ஆதாரம் ஆகியவற்றை சேமியுங்கள்.",
                            "காவல் நிலையத்தில் எழுத்துப்பூர்வ புகார் கொடுத்து CSR/FIR எண் மற்றும் பெறுபதிவு நகலை கேளுங்கள்.",
                            "பதிவு செய்ய மறுத்தால் மாவட்ட SP/மேலதிகாரிக்கு பதிவு தபால் அல்லது மின்னஞ்சல் மூலம் புகார் அனுப்புங்கள்."
                    ),
                    List.of(
                            "காவல் நிலையத்தில் புகார் கொடுக்க உங்களுக்கு உரிமை உள்ளது.",
                            "புகார் பெற்றதற்கான எண் அல்லது எழுத்துப்பூர்வ சான்று கேட்கலாம்.",
                            "பெண்கள் தொடர்பான புகார்களில் பெண் அதிகாரி மற்றும் தனியுரிமை கேட்கலாம்."
                    ),
                    List.of(
                            "இன்று சம்பவ விவரத்தை ஒரு பக்கத்தில் தெளிவாக எழுதி ஆதாரங்களை இணைக்கவும்.",
                            "உடனடி ஆபத்து இருந்தால் 112 அழைக்கவும்.",
                            "FIR மறுப்பு அல்லது கைது/ஜாமீன் பிரச்சினை இருந்தால் குற்றவியல் வழக்கறிஞரை அணுகுங்கள்."
                    ),
                    List.of(),
                    List.of(),
                    disclaimer(aiError)
            );
            return response;
        }
        response = new AskResponse(
                "பொது சட்ட வழிகாட்டல்",
                "General",
                "உங்கள் கேள்விக்கு துல்லியமான பதில் தர சம்பவம் என்ன, எப்போது, எங்கு, யார் தொடர்புடையவர், என்ன ஆதாரம் உள்ளது என்பவை முக்கியம். முதலில் உண்மைகளை நேர வரிசையில் எழுதுவது பாதுகாப்பான முதல் படி. அதன்பின் பிரச்சினை காவல், குடும்பம், நுகர்வோர், சொத்து, சைபர் மோசடி அல்லது வேலை தொடர்பானதா என்பதைப் பொறுத்து அடுத்த அதிகாரியை அணுகலாம்.",
                List.of(
                        "சம்பவத்தை தேதி/நேர வரிசையில் எழுதுங்கள்.",
                        "ஆவணங்கள், ரசீதுகள், புகைப்படங்கள், செய்திகள், சாட்சிகள் ஆகியவற்றை பட்டியலிடுங்கள்.",
                        "உடனடி ஆபத்து இருந்தால் 112 அழைக்கவும்.",
                        "முக்கிய தொகை, கைது, சொத்து அல்லது குடும்ப பாதுகாப்பு பிரச்சினை என்றால் பொருத்தமான வழக்கறிஞரை அணுகுங்கள்."
                ),
                List.of(
                        "சட்ட உதவி கேட்க உங்களுக்கு உரிமை உள்ளது.",
                        "எந்த அலுவலகத்திலும் புகார்/கோரிக்கை கொடுத்தால் பெறுபதிவு எண் கேட்கலாம்."
                ),
                List.of(
                        "மேலும் துல்லியமான பதிலுக்கு உங்கள் பிரச்சினையை இரண்டு வாக்கியங்களில் தெளிவாக எழுதுங்கள்.",
                        "புகார் எழுதும்போது தேதி, இடம், நபர், ஆதாரம், கோரிக்கை ஆகியவற்றை சேர்க்கவும்."
                ),
                List.of(),
                List.of(),
                disclaimer(aiError)
        );
        return response;
    }

    private boolean hasAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private String disclaimer(String aiError) {
        if (aiError != null && !aiError.isBlank()) {
            lastSarvamError = aiError;
        }
        return "இது பொதுவான சட்ட விழிப்புணர்வு வழிகாட்டல் மட்டுமே; குறிப்பிட்ட வழக்கிற்கு தகுதியான வழக்கறிஞரிடம் ஆலோசனை பெறுங்கள்.";
    }

    public AskResponse firResponse() {
        return new AskResponse(
                "முதல் தகவல் அறிக்கை வழிகாட்டி",
                "Criminal Law",
                "குற்றம் தொடர்பான புகாருக்கு சம்பவ விவரம், ஆதாரம், சாட்சி விவரம் ஆகியவற்றுடன் காவல் நிலையத்தில் புகார் அளிக்க வேண்டும்.",
                List.of("சம்பவத்தை நேர வரிசையில் எழுதுங்கள்.", "ஆதாரங்களை சேமியுங்கள்.", "CSR/FIR எண் கேளுங்கள்.", "மறுத்தால் SP/மேல் அதிகாரிக்கு எழுத்துப்பூர்வமாக அனுப்புங்கள்."),
                List.of("புகார் அளிக்க உரிமை உள்ளது.", "பெறுபதிவு நகல் கேட்கலாம்."),
                List.of("அவசரம் என்றால் 112 அழைக்கவும்.", "தேவைப்பட்டால் குற்றவியல் வழக்கறிஞரை அணுகுங்கள்."),
                suggestLawyers("Criminal Law"),
                List.of(),
                "இது பொதுவான வழிகாட்டல் மட்டுமே."
        );
    }

    public List<FaqItem> faqs() {
        return List.of(
                new FaqItem("fir", "காவல் புகார்", "காவல் நிலையம் FIR எடுக்க மறுத்தால்?", "மேல் அதிகாரிக்கு எழுத்துப்பூர்வ புகார் அனுப்பி ஆதாரத்தை வைத்திருங்கள்."),
                new FaqItem("consumer", "நுகர்வோர்", "குறைபாடுள்ள பொருளுக்கு பணத்திருப்பு?", "பில் மற்றும் ஆதாரத்துடன் விற்பனையாளருக்கு எழுத்துப்பூர்வ புகார் அனுப்புங்கள்."),
                new FaqItem("cyber", "சைபர் மோசடி", "UPI மோசடி நடந்தால்?", "1930 அழைத்து உடனடியாக cybercrime.gov.in-ல் புகார் அளிக்கவும்.")
        );
    }

    public List<LawyerItem> lawyers() {
        List<LawyerItem> list = new ArrayList<>();
        if (userAccountRepository != null) {
            for (UserAccount u : userAccountRepository.findAll()) {
                if ("lawyer".equalsIgnoreCase(u.getRole())) {
                    Map<String, Object> profile = u.getLawyerProfile();
                    String category = profile != null ? String.valueOf(profile.getOrDefault("category", "General")) : "General";
                    String city = profile != null ? String.valueOf(profile.getOrDefault("city", u.getDistrict())) : u.getDistrict();
                    String barId = profile != null ? String.valueOf(profile.getOrDefault("barId", "சரிபார்க்கப்பட்டது")) : "சரிபார்க்கப்பட்டது";
                    String exp = profile != null ? String.valueOf(profile.getOrDefault("experience", "9 ஆண்டுகள்")) : "9 ஆண்டுகள்";
                    String bio = profile != null ? String.valueOf(profile.getOrDefault("bio", "உங்கள் வழக்கின் ஆவணங்கள் மற்றும் உண்மை விவரங்களை வைத்து, சரியான அடுத்த படிகளை திட்டமிட்டு வழிகாட்ட முடியும்.")) : "உங்கள் வழக்கின் ஆவணங்கள் மற்றும் உண்மை விவரங்களை வைத்து, சரியான அடுத்த படிகளை திட்டமிட்டு வழிகாட்ட முடியும்.";
                    
                    List<String> caseHistory = new ArrayList<>();
                    if (profile != null && profile.get("caseHistory") instanceof List) {
                        try {
                            List<?> rawList = (List<?>) profile.get("caseHistory");
                            for (Object obj : rawList) {
                                if (obj != null) {
                                    caseHistory.add(String.valueOf(obj));
                                }
                            }
                        } catch (Exception e) {
                            // ignore
                        }
                    }

                    list.add(new LawyerItem(
                            "u" + u.getId(),
                            u.getName(),
                            category,
                            city,
                            u.getPhone(),
                            4.9,
                            true,
                            exp,
                            barId,
                            bio,
                            caseHistory
                    ));
                }
            }
        }
        
        if (list.isEmpty()) {
            return List.of(
                    new LawyerItem("l1", "Adv. Priya Raman", "Criminal Law", "Chennai", "+91 90000 10001", 4.9, true, "9 ஆண்டுகள்", "TN/2145/2016", "FIR மறுப்பு, கைது உரிமைகள், பெண் பாதுகாப்பு, நுகர்வோர் புகார்கள் மற்றும் அவசர காவல் நிலைய ஆதரவ உபர் கவனம் செலுத்துகிறது."),
                    new LawyerItem("l2", "Adv. Meena Raj", "Family Law", "Madurai", "+91 90000 10002", 4.8, true, "11 ஆண்டுகள்", "TN/1882/2013", "பாதுகாப்பு திட்டமிடல், பாதுகாப்பு உத்தரவுகள், பராமரிப்பு கோரிக்கைகள், மத்தியஸ்தம் தயாரிப்பு மற்றும் குழந்தை நல ஆவணங்கள் மற்றும் குடும்பங்களைக் கூட்டுகிறது."),
                    new LawyerItem("l3", "Adv. Prakash Vel", "Consumer Law", "Coimbatore", "+91 90000 10003", 4.7, true, "7 ஆண்டுகள்", "TN/3310/2018", "நுகர்வோர்களுக்கு ஆவணங்கள், உத்தரவாதம் சான்று, சேவை ஆவணங்கள் மற்றும் விற்பனையாளரின் செய்திகளை சேகரிக்க உதவுகிறது."),
                    new LawyerItem("l4", "Adv. Latha Siva", "Property Law", "Trichy", "+91 90000 10004", 4.9, true, "13 ஆண்டுகள்", "TN/0924/2011", "நிலப்பதிவு ஆவணங்கள், குத்தகை ஒப்பந்தங்கள், சொத்து நோட்டீஸ்கள், எல்லை ஆவணங்கள் மற்றும் குத்தகை உரிமையாளர் சர்ச்சை ஆதாரங்களை மதிப்பாய்வு செய்கிறது.")
            );
        }
        return list;
    }

    public List<EmergencyItem> emergency() {
        return List.of(
                new EmergencyItem("தேசிய அவசரம் (National Emergency)", "112", "அனைத்து அவசர தேவைகள் மற்றும் காவல் உதவிக்காக"),
                new EmergencyItem("பெண்கள் உதவி (Women Helpline)", "181", "பெண்கள் பாதுகாப்பு, வன்முறை மற்றும் உடனடி ஆதரவுக்காக"),
                new EmergencyItem("இலவச சட்ட உதவி (Free Legal Aid - NALSA)", "15100", "சட்ட சேவை ஆணையத்தின் இலவச சட்ட உதவி மற்றும் ஆலோசனைகளுக்காக"),
                new EmergencyItem("சைபர் நிதி மோசடி (Cyber Financial Fraud)", "1930", "ஆன்லைன் வங்கி அல்லது UPI பண மோசடி புகார்களைப் பதிவு செய்ய"),
                new EmergencyItem("நுகர்வோர் உதவி (National Consumer Helpline)", "1915", "நுகர்வோர் பொருள் மற்றும் சேவை தொடர்பான புகார்களைப் பதிவு செய்ய"),
                new EmergencyItem("குழந்தை உதவி (Child Helpline)", "1098", "குழந்தை பாதுகாப்பு, ஆதரவு மற்றும் கடத்தல் தடுப்புக்காக"),
                new EmergencyItem("மூத்த குடிமக்கள் உதவி (Senior Citizen Helpline)", "14567", "மூத்த குடிமக்களின் பாதுகாப்பு, பராமரிப்பு மற்றும் உதவிக்காக"),
                new EmergencyItem("மாநில அவசர கட்டுப்பாடு (State Emergency)", "1070", "பேரிடர் மற்றும் இயற்கை பேரிடர் கால கட்டுப்பாட்டு அறைக்காக")
        );
    }

    public List<QueryHistory> history(String userId) {
        return historyRepository.findTop25ByUserIdOrderByCreatedAtDesc(userId);
    }

    private String stringValue(Object value, String fallback) {
        return value instanceof String text && !text.isBlank() ? text : fallback;
    }

    private List<String> stringList(Object value) {
        if (value instanceof List<?> list) {
            List<String> cleaned = list.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .filter(item -> !item.isBlank())
                    .toList();
            if (!cleaned.isEmpty()) {
                return cleaned;
            }
        }
        return List.of("சம்பவ விவரங்கள், தேதிகள், ஆவணங்கள் மற்றும் ஆதாரங்களை ஒழுங்காக சேமியுங்கள்.");
    }

    private void saveHistory(AskRequest request, AskResponse response) {
        QueryHistory history = new QueryHistory();
        history.setUserId(request.userId());
        history.setTopic(response.topic());
        history.setQueryText(request.query());
        history.setResponseText(response.summary());
        historyRepository.save(history);
    }

    private AskResponse enrichWithLawyersAndSources(String query, AskResponse base) {
        String category = normalizeCategory(Optional.ofNullable(base.category()).orElse("General"));
        List<LawyerItem> suggestions = suggestLawyers(category);
        List<String> sources = new ArrayList<>();
        return new AskResponse(
                base.topic(),
                category,
                base.summary(),
                base.steps(),
                base.rights(),
                base.nextActions(),
                suggestions,
                sources,
                base.disclaimer()
        );
    }

    private List<LawyerItem> suggestLawyers(String category) {
        List<LawyerItem> all = lawyers();
        List<LawyerItem> filtered = all.stream()
                .filter(item -> item.category() != null && item.category().equalsIgnoreCase(category))
                .toList();
        return (filtered.isEmpty() ? all : filtered).stream().limit(3).toList();
    }

    private String normalizeCategory(String raw) {
        if (raw == null || raw.isBlank()) return "General";
        String cleaned = raw.trim();
        return switch (cleaned) {
            case "Criminal", "Criminal law", "Criminal Law" -> "Criminal Law";
            case "Family", "Family law", "Family Law" -> "Family Law";
            case "Consumer", "Consumer law", "Consumer Law" -> "Consumer Law";
            case "Property", "Property law", "Property Law" -> "Property Law";
            case "Cyber", "Cyber crime", "Cyber Crime" -> "Cyber Crime";
            case "Labour", "Labor", "Labour law", "Labour Law" -> "Labour Law";
            default -> "General";
        };
    }

    private record SarvamCall(AskResponse response, String error) {}
}
