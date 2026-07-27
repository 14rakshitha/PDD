package com.lawvoice.repository;

import com.lawvoice.model.LegalDeadline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LegalDeadlineRepository extends JpaRepository<LegalDeadline, Long> {
    List<LegalDeadline> findByUserPhoneOrderByDueDateAsc(String userPhone);
    List<LegalDeadline> findByUserNameOrderByDueDateAsc(String userName);
}
