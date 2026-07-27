package com.lawvoice.service;

import com.lawvoice.model.LegalDeadline;
import com.lawvoice.model.RtiApplication;
import com.lawvoice.repository.LegalDeadlineRepository;
import com.lawvoice.repository.RtiApplicationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class ToolsService {

    private final RtiApplicationRepository rtiRepo;
    private final LegalDeadlineRepository deadlineRepo;

    public ToolsService(RtiApplicationRepository rtiRepo, LegalDeadlineRepository deadlineRepo) {
        this.rtiRepo = rtiRepo;
        this.deadlineRepo = deadlineRepo;
    }

    // --- RTI Applications ---
    public RtiApplication saveRtiDraft(RtiApplication rti) {
        return rtiRepo.save(rti);
    }

    public List<RtiApplication> getRtiDraftsForUser(String applicantName, String applicantPhone) {
        if (applicantPhone != null && !applicantPhone.isBlank()) {
            List<RtiApplication> list = rtiRepo.findByApplicantPhoneOrderByIdDesc(applicantPhone);
            if (!list.isEmpty()) return list;
        }
        if (applicantName != null && !applicantName.isBlank()) {
            return rtiRepo.findByApplicantNameOrderByIdDesc(applicantName);
        }
        return rtiRepo.findAll();
    }

    // --- Legal Deadlines ---
    public LegalDeadline createLegalDeadline(LegalDeadline deadline) {
        if (deadline.getDueDate() == null && deadline.getStartDate() != null && deadline.getLimitationDays() > 0) {
            deadline.setDueDate(deadline.getStartDate().plusDays(deadline.getLimitationDays()));
        }
        updateDeadlineStatus(deadline);
        return deadlineRepo.save(deadline);
    }

    public List<LegalDeadline> getDeadlinesForUser(String userName, String userPhone) {
        List<LegalDeadline> list;
        if (userPhone != null && !userPhone.isBlank()) {
            list = deadlineRepo.findByUserPhoneOrderByDueDateAsc(userPhone);
        } else if (userName != null && !userName.isBlank()) {
            list = deadlineRepo.findByUserNameOrderByDueDateAsc(userName);
        } else {
            list = deadlineRepo.findAll();
        }

        // Recalculate status dynamically based on current date
        for (LegalDeadline dl : list) {
            updateDeadlineStatus(dl);
        }
        return list;
    }

    public Optional<LegalDeadline> updateStatus(Long id, String status) {
        return deadlineRepo.findById(id).map(dl -> {
            dl.setStatus(status);
            return deadlineRepo.save(dl);
        });
    }

    private void updateDeadlineStatus(LegalDeadline dl) {
        if ("Completed".equals(dl.getStatus())) return;
        if (dl.getDueDate() == null) return;

        LocalDate today = LocalDate.now();
        long daysRemaining = ChronoUnit.DAYS.between(today, dl.getDueDate());

        if (daysRemaining < 0) {
            dl.setStatus("Missed");
        } else if (daysRemaining <= 7) {
            dl.setStatus("Expiring Soon");
        } else {
            dl.setStatus("Active");
        }
    }
}
