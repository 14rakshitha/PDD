package com.lawvoice.repository;

import com.lawvoice.model.DocumentVault;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentVaultRepository extends JpaRepository<DocumentVault, Long> {
    List<DocumentVault> findByOwnerPhoneOrderByIdDesc(String ownerPhone);
    List<DocumentVault> findByOwnerNameOrderByIdDesc(String ownerName);
    List<DocumentVault> findBySharedWithLawyerIdOrderByIdDesc(Long sharedWithLawyerId);
    List<DocumentVault> findBySharedWithLawyerNameOrderByIdDesc(String sharedWithLawyerName);
}
