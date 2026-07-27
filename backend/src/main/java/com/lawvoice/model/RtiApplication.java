package com.lawvoice.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import java.time.LocalDateTime;

@Entity
@Table(name = "rti_applications")
public class RtiApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String applicantName;
    private String applicantAddress;
    private String applicantPhone;
    private String applicantEmail;
    
    private String publicAuthorityName; // e.g. "Public Information Officer, Greater Chennai Corporation"
    private String publicAuthorityAddress;
    
    private String subject;
    
    @Column(columnDefinition = "TEXT")
    private String questions; // Stores line-separated queries or JSON list
    
    private String periodOfInfo; // e.g. "2023 - 2024"
    private String feeDetails;   // e.g. "Rs. 10 Court Fee Stamp attached"
    private String language = "ta"; // "ta" or "en"
    
    private LocalDateTime createdAt = LocalDateTime.now();

    public RtiApplication() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public String getApplicantAddress() { return applicantAddress; }
    public void setApplicantAddress(String applicantAddress) { this.applicantAddress = applicantAddress; }

    public String getApplicantPhone() { return applicantPhone; }
    public void setApplicantPhone(String applicantPhone) { this.applicantPhone = applicantPhone; }

    public String getApplicantEmail() { return applicantEmail; }
    public void setApplicantEmail(String applicantEmail) { this.applicantEmail = applicantEmail; }

    public String getPublicAuthorityName() { return publicAuthorityName; }
    public void setPublicAuthorityName(String publicAuthorityName) { this.publicAuthorityName = publicAuthorityName; }

    public String getPublicAuthorityAddress() { return publicAuthorityAddress; }
    public void setPublicAuthorityAddress(String publicAuthorityAddress) { this.publicAuthorityAddress = publicAuthorityAddress; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getQuestions() { return questions; }
    public void setQuestions(String questions) { this.questions = questions; }

    public String getPeriodOfInfo() { return periodOfInfo; }
    public void setPeriodOfInfo(String periodOfInfo) { this.periodOfInfo = periodOfInfo; }

    public String getFeeDetails() { return feeDetails; }
    public void setFeeDetails(String feeDetails) { this.feeDetails = feeDetails; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
