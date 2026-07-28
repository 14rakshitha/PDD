package com.lawvoice.repository;

import com.lawvoice.model.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserAccountJpaRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    Optional<UserAccount> findByPhone(String phone);
}
