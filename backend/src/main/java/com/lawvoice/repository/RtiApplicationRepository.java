package com.lawvoice.repository;

import com.lawvoice.model.RtiApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RtiApplicationRepository extends JpaRepository<RtiApplication, Long> {
    List<RtiApplication> findByApplicantPhoneOrderByIdDesc(String applicantPhone);
    List<RtiApplication> findByApplicantNameOrderByIdDesc(String applicantName);
}
