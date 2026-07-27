package com.lawvoice.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_vault")
public class DocumentVault {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ownerName;
    private String ownerPhone;
    
    private String fileName;
    private String fileType;
    private String docCategory; // FIR, Contract, ID Proof, Evidence, General
    
    @Column(columnDefinition = "TEXT")
    private String fileData; // Base64 data or secure URI content
    
    private Long sharedWithLawyerId;
    private String sharedWithLawyerName;
    private Long consultationId;
    
    private LocalDateTime uploadedAt = LocalDateTime.now();

    public DocumentVault() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getOwnerPhone() { return ownerPhone; }
    public void setOwnerPhone(String ownerPhone) { this.ownerPhone = ownerPhone; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public String getDocCategory() { return docCategory; }
    public void setDocCategory(String docCategory) { this.docCategory = docCategory; }

    public String getFileData() { return fileData; }
    public void setFileData(String fileData) { this.fileData = fileData; }

    public Long getSharedWithLawyerId() { return sharedWithLawyerId; }
    public void setSharedWithLawyerId(Long sharedWithLawyerId) { this.sharedWithLawyerId = sharedWithLawyerId; }

    public String getSharedWithLawyerName() { return sharedWithLawyerName; }
    public void setSharedWithLawyerName(String sharedWithLawyerName) { this.sharedWithLawyerName = sharedWithLawyerName; }

    public Long getConsultationId() { return consultationId; }
    public void setConsultationId(Long consultationId) { this.consultationId = consultationId; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}
