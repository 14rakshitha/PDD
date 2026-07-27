package com.lawvoice.repository;

import com.lawvoice.model.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    List<Consultation> findByClientPhoneOrderByIdDesc(String clientPhone);
    List<Consultation> findByClientNameOrderByIdDesc(String clientName);
    List<Consultation> findByLawyerIdOrderByIdDesc(Long lawyerId);
    List<Consultation> findByLawyerNameOrderByIdDesc(String lawyerName);
}
