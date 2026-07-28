package com.lawvoice.service;

import com.lawvoice.dto.AuthLoginRequest;
import com.lawvoice.dto.AuthRegisterRequest;
import com.lawvoice.dto.AuthResponse;
import com.lawvoice.dto.AuthUserDto;
import com.lawvoice.model.UserAccount;
import com.lawvoice.repository.UserAccountRepository;
import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserAccountRepository users;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final Map<String, Long> sessions = new ConcurrentHashMap<>();

    public AuthService(UserAccountRepository users) {
        this.users = users;
    }

    @PostConstruct
    void seedDemoUsers() {
        registerIfMissing("people", "டெமோ பயனர்", "people@lawvoice.com", "people123", "+91 98765 43210", "சென்னை", null);
        
        Map<String, Object> lawyerProfile1 = new HashMap<>();
        lawyerProfile1.put("barId", "TN/2145/2016");
        lawyerProfile1.put("category", "குற்றவியல் சட்டம்");
        lawyerProfile1.put("city", "சென்னை");
        lawyerProfile1.put("experience", "9 ஆண்டுகள்");
        lawyerProfile1.put("bio", "FIR மறுப்பு, கைது உரிமைகள், பெண் பாதுகாப்பு, நுகர்வோர் புகார்கள் மற்றும் அவசர காவல் நிலைய ஆதரவ உபர் கவனம் செலுத்துகிறது.");
        registerIfMissing("lawyer", "Adv. ப்ரியா ராமன்", "lawyer@lawvoice.com", "lawyer123", "+91 90000 10001", "சென்னை", lawyerProfile1);

        Map<String, Object> lawyerProfile2 = new HashMap<>();
        lawyerProfile2.put("barId", "TN/1882/2013");
        lawyerProfile2.put("category", "குடும்ப சட்டம்");
        lawyerProfile2.put("city", "மதுரை");
        lawyerProfile2.put("experience", "11 ஆண்டுகள்");
        lawyerProfile2.put("bio", "பாதுகாப்பு திட்டமிடல், பாதுகாப்பு உத்தரவுகள், பராமரிப்பு கோரிக்கைகள், மத்தியஸ்தம் தயாரிப்பு மற்றும் குழந்தை நல ஆவணங்கள் மற்றும் குடும்பங்களைக் கூட்டுகிறது.");
        registerIfMissing("lawyer", "Adv. மீனா ராஜ்", "meena@lawvoice.com", "lawyer123", "+91 90000 10002", "மதுரை", lawyerProfile2);

        Map<String, Object> lawyerProfile3 = new HashMap<>();
        lawyerProfile3.put("barId", "TN/3310/2018");
        lawyerProfile3.put("category", "நுகர்வோர் சட்டம்");
        lawyerProfile3.put("city", "கோயம்புத்தூர்");
        lawyerProfile3.put("experience", "7 ஆண்டுகள்");
        lawyerProfile3.put("bio", "நுகர்வோர்களுக்கு ஆவணங்கள், உத்தரவாதம் சான்று, சேவை ஆவணங்கள் மற்றும் விற்பனையாளரின் செய்திகளை சேகரிக்க உதவுகிறது.");
        registerIfMissing("lawyer", "Adv. பிரகாஷ் வேல்", "prakash@lawvoice.com", "lawyer123", "+91 90000 10003", "கோயம்புத்தூர்", lawyerProfile3);

        Map<String, Object> lawyerProfile4 = new HashMap<>();
        lawyerProfile4.put("barId", "TN/0924/2011");
        lawyerProfile4.put("category", "சொத்து சட்டம்");
        lawyerProfile4.put("city", "திருச்சி");
        lawyerProfile4.put("experience", "13 ஆண்டுகள்");
        lawyerProfile4.put("bio", "நிலப்பதிவு ஆவணங்கள், குத்தகை ஒப்பந்தங்கள், சொத்து நோட்டீஸ்கள், எல்லை ஆவணங்கள் மற்றும் குத்தகை உரிமையாளர் சர்ச்சை ஆதாரங்களை மதிப்பாய்வு செய்கிறது.");
        registerIfMissing("lawyer", "Adv. லதா சிவா", "latha@lawvoice.com", "lawyer123", "+91 90000 10004", "திருச்சி", lawyerProfile4);
    }

    public AuthResponse register(AuthRegisterRequest request) {
        String role = normalizeRole(request.role());
        if (users.existsByName(request.name().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "இந்த பெயர் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது.");
        }
        String pwd = request.password();
        if (pwd == null || pwd.length() < 8 || 
            !pwd.matches(".*[a-zA-Z].*") || 
            !pwd.matches(".*[0-9].*") || 
            !pwd.matches(".*[!@#$%^&*(),.?\":{}|<>].*")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "கடவுச்சொல் குறைந்தது 8 எழுத்துக்கள், ஒரு ஆங்கில எழுத்து, ஒரு எண் மற்றும் ஒரு சிறப்பு குறியீட்டைக் கொண்டிருக்க வேண்டும்.");
        }
        UserAccount account = new UserAccount();
        account.setRole(role);
        account.setName(request.name().trim());
        account.setEmail(request.name().trim().replaceAll("\\s+", "").toLowerCase() + "@lawvoice.com");
        account.setPasswordHash(encoder.encode(request.password()));
        account.setPhone(request.phone().trim());
        account.setDistrict(request.district().trim());
        if ("lawyer".equals(role)) {
            account.setLawyerProfile(request.lawyerProfile() == null ? Map.of() : request.lawyerProfile());
        }
        users.save(account);
        return buildResponse(account, "பதிவு வெற்றிகரமாக முடிந்தது.");
    }

    public AuthResponse login(AuthLoginRequest request) {
        String role = normalizeRole(request.role());

        boolean hasName = request.name() != null && !request.name().isBlank();
        boolean hasPhone = request.phone() != null && !request.phone().isBlank();

        if (!hasName && !hasPhone) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "பெயர் அல்லது கைபேசி எண் அளிக்கவும்.");
        }

        Optional<UserAccount> found = hasPhone
                ? users.findByPhone(request.phone().trim())
                : users.findByName(request.name().trim());

        if (found.isEmpty() && hasPhone && hasName) {
            found = users.findByName(request.name().trim());
        }

        UserAccount account = found.orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "பெயர் / கைபேசி எண் அல்லது கடவுச்சொல் தவறானது."));

        if (!role.equals(account.getRole())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "இந்த கணக்கு தேர்ந்தெடுத்த பாத்திரத்திற்கு பொருந்தாது.");
        }
        if (!encoder.matches(request.password(), account.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "பெயர் / கைபேசி எண் அல்லது கடவுச்சொல் தவறானது.");
        }
        return buildResponse(account, "வெற்றிகரமாக உள்நுழைந்தீர்கள்.");
    }

    public AuthUserDto me(String token) {
        Long userId = sessions.get(token);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "அமர்வு காலாவதியானது. மீண்டும் உள்நுழையவும்.");
        }
        return users.findById(userId)
                .map(this::toDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "பயனர் கிடைக்கவில்லை."));
    }

    public AuthUserDto updateProfile(String token, Map<String, Object> newProfile) {
        Long userId = sessions.get(token);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "அமர்வு காலாவதியானது. மீண்டும் உள்நுழையவும்.");
        }
        UserAccount account = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "பயனர் கிடைக்கவில்லை."));
        
        if (newProfile.containsKey("name")) {
            account.setName(String.valueOf(newProfile.get("name")).trim());
        }
        if (newProfile.containsKey("phone")) {
            account.setPhone(String.valueOf(newProfile.get("phone")).trim());
        }
        if (newProfile.containsKey("district")) {
            account.setDistrict(String.valueOf(newProfile.get("district")).trim());
        }
        
        if ("lawyer".equals(account.getRole())) {
            account.setLawyerProfile(newProfile);
        }
        users.save(account);
        return toDto(account);
    }

    private AuthResponse buildResponse(UserAccount account, String message) {
        String token = UUID.randomUUID().toString();
        sessions.put(token, account.getId());
        return new AuthResponse(token, message, toDto(account));
    }

    private AuthUserDto toDto(UserAccount account) {
        return new AuthUserDto(
                account.getId(),
                account.getRole(),
                account.getName(),
                account.getEmail(),
                account.getPhone(),
                account.getDistrict(),
                account.getLawyerProfile()
        );
    }

    private void registerIfMissing(String role, String name, String email, String password, String phone, String district, Map<String, Object> lawyerProfile) {
        if (users.existsByName(name)) return;
        UserAccount account = new UserAccount();
        account.setRole(role);
        account.setName(name);
        account.setEmail(email);
        account.setPasswordHash(encoder.encode(password));
        account.setPhone(phone);
        account.setDistrict(district);
        account.setLawyerProfile(lawyerProfile);
        users.save(account);
    }

    private String normalizeRole(String role) {
        return role == null ? "people" : role.trim().toLowerCase();
    }

    public List<Map<String, Object>> getDebugUsers() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (UserAccount u : users.findAll()) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getName());
            map.put("email", u.getEmail());
            map.put("phone", u.getPhone());
            map.put("role", u.getRole());
            map.put("passwordHash", u.getPasswordHash());
            map.put("district", u.getDistrict());
            map.put("lawyerProfile", u.getLawyerProfile());
            list.add(map);
        }
        return list;
    }
}
