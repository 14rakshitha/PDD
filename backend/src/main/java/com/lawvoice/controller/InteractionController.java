package com.lawvoice.controller;

import com.lawvoice.model.ChatMessage;
import com.lawvoice.model.Consultation;
import com.lawvoice.model.DocumentVault;
import com.lawvoice.service.InteractionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(originPatterns = "*")
public class InteractionController {

    private final InteractionService interactionService;

    public InteractionController(InteractionService interactionService) {
        this.interactionService = interactionService;
    }

    // --- Consultation Endpoints ---
    @PostMapping("/consultations/book")
    public ResponseEntity<Consultation> bookConsultation(@RequestBody Consultation consultation) {
        Consultation booked = interactionService.bookConsultation(consultation);
        return ResponseEntity.ok(booked);
    }

    @GetMapping("/consultations/client")
    public ResponseEntity<List<Consultation>> getClientConsultations(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone) {
        return ResponseEntity.ok(interactionService.getConsultationsForClient(name, phone));
    }

    @GetMapping("/consultations/lawyer")
    public ResponseEntity<List<Consultation>> getLawyerConsultations(
            @RequestParam(required = false) Long lawyerId,
            @RequestParam(required = false) String lawyerName) {
        return ResponseEntity.ok(interactionService.getConsultationsForLawyer(lawyerId, lawyerName));
    }

    @PutMapping("/consultations/{id}/status")
    public ResponseEntity<Consultation> updateConsultationStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "Pending");
        return interactionService.updateConsultationStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- Document Vault Endpoints ---
    @PostMapping("/documents/upload")
    public ResponseEntity<DocumentVault> uploadDocument(@RequestBody DocumentVault doc) {
        DocumentVault saved = interactionService.saveDocument(doc);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/documents/my-vault")
    public ResponseEntity<List<DocumentVault>> getMyVault(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone) {
        return ResponseEntity.ok(interactionService.getVaultForClient(name, phone));
    }

    @GetMapping("/documents/shared-with-me")
    public ResponseEntity<List<DocumentVault>> getSharedDocuments(
            @RequestParam(required = false) Long lawyerId,
            @RequestParam(required = false) String lawyerName) {
        return ResponseEntity.ok(interactionService.getSharedDocumentsForLawyer(lawyerId, lawyerName));
    }

    @PostMapping("/documents/{id}/share")
    public ResponseEntity<DocumentVault> shareDocument(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Long lawyerId = body.containsKey("lawyerId") ? Long.valueOf(body.get("lawyerId").toString()) : null;
        String lawyerName = body.containsKey("lawyerName") ? (String) body.get("lawyerName") : null;
        Long consultationId = body.containsKey("consultationId") ? Long.valueOf(body.get("consultationId").toString()) : null;

        return interactionService.shareDocumentWithLawyer(id, lawyerId, lawyerName, consultationId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- Chat Endpoints ---
    @PostMapping("/chat/send")
    public ResponseEntity<ChatMessage> sendMessage(@RequestBody ChatMessage message) {
        ChatMessage sent = interactionService.sendMessage(message);
        return ResponseEntity.ok(sent);
    }

    @GetMapping("/chat/{consultationId}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable Long consultationId) {
        return ResponseEntity.ok(interactionService.getChatHistory(consultationId));
    }
}
