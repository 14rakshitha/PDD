package com.lawvoice.service;

import com.lawvoice.model.ChatMessage;
import com.lawvoice.model.Consultation;
import com.lawvoice.model.DocumentVault;
import com.lawvoice.repository.ChatMessageRepository;
import com.lawvoice.repository.ConsultationRepository;
import com.lawvoice.repository.DocumentVaultRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class InteractionService {

    private final ConsultationRepository consultationRepo;
    private final DocumentVaultRepository documentVaultRepo;
    private final ChatMessageRepository chatMessageRepo;

    public InteractionService(ConsultationRepository consultationRepo,
                              DocumentVaultRepository documentVaultRepo,
                              ChatMessageRepository chatMessageRepo) {
        this.consultationRepo = consultationRepo;
        this.documentVaultRepo = documentVaultRepo;
        this.chatMessageRepo = chatMessageRepo;
    }

    // --- Consultations ---
    public Consultation bookConsultation(Consultation consultation) {
        if (consultation.getStatus() == null || consultation.getStatus().isBlank()) {
            consultation.setStatus("Pending");
        }
        return consultationRepo.save(consultation);
    }

    public List<Consultation> getConsultationsForClient(String clientName, String clientPhone) {
        if (clientPhone != null && !clientPhone.isBlank()) {
            List<Consultation> list = consultationRepo.findByClientPhoneOrderByIdDesc(clientPhone);
            if (!list.isEmpty()) return list;
        }
        if (clientName != null && !clientName.isBlank()) {
            return consultationRepo.findByClientNameOrderByIdDesc(clientName);
        }
        return consultationRepo.findAll();
    }

    public List<Consultation> getConsultationsForLawyer(Long lawyerId, String lawyerName) {
        if (lawyerId != null && lawyerId > 0) {
            List<Consultation> list = consultationRepo.findByLawyerIdOrderByIdDesc(lawyerId);
            if (!list.isEmpty()) return list;
        }
        if (lawyerName != null && !lawyerName.isBlank()) {
            return consultationRepo.findByLawyerNameOrderByIdDesc(lawyerName);
        }
        return consultationRepo.findAll();
    }

    public Optional<Consultation> updateConsultationStatus(Long id, String status) {
        return consultationRepo.findById(id).map(consultation -> {
            consultation.setStatus(status);
            return consultationRepo.save(consultation);
        });
    }

    // --- Document Vault ---
    public DocumentVault saveDocument(DocumentVault doc) {
        return documentVaultRepo.save(doc);
    }

    public List<DocumentVault> getVaultForClient(String ownerName, String ownerPhone) {
        if (ownerPhone != null && !ownerPhone.isBlank()) {
            List<DocumentVault> list = documentVaultRepo.findByOwnerPhoneOrderByIdDesc(ownerPhone);
            if (!list.isEmpty()) return list;
        }
        if (ownerName != null && !ownerName.isBlank()) {
            return documentVaultRepo.findByOwnerNameOrderByIdDesc(ownerName);
        }
        return documentVaultRepo.findAll();
    }

    public List<DocumentVault> getSharedDocumentsForLawyer(Long lawyerId, String lawyerName) {
        if (lawyerId != null && lawyerId > 0) {
            List<DocumentVault> list = documentVaultRepo.findBySharedWithLawyerIdOrderByIdDesc(lawyerId);
            if (!list.isEmpty()) return list;
        }
        if (lawyerName != null && !lawyerName.isBlank()) {
            return documentVaultRepo.findBySharedWithLawyerNameOrderByIdDesc(lawyerName);
        }
        return documentVaultRepo.findAll();
    }

    public Optional<DocumentVault> shareDocumentWithLawyer(Long docId, Long lawyerId, String lawyerName, Long consultationId) {
        return documentVaultRepo.findById(docId).map(doc -> {
            doc.setSharedWithLawyerId(lawyerId);
            doc.setSharedWithLawyerName(lawyerName);
            doc.setConsultationId(consultationId);
            return documentVaultRepo.save(doc);
        });
    }

    // --- Chat Messages ---
    public ChatMessage sendMessage(ChatMessage message) {
        return chatMessageRepo.save(message);
    }

    public List<ChatMessage> getChatHistory(Long consultationId) {
        return chatMessageRepo.findByConsultationIdOrderByIdAsc(consultationId);
    }
}
