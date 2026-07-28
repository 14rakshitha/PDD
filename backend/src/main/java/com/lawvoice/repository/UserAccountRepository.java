package com.lawvoice.repository;

import com.lawvoice.model.UserAccount;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.Optional;

@Repository
public class UserAccountRepository {
    private final UserAccountJpaRepository jpaRepository;

    public UserAccountRepository(UserAccountJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    public UserAccount save(UserAccount account) {
        return jpaRepository.save(account);
    }

    public boolean existsByName(String name) {
        if (name == null || name.isBlank()) return false;
        return jpaRepository.existsByNameIgnoreCase(name.trim());
    }

    public Optional<UserAccount> findByName(String name) {
        if (name == null || name.isBlank()) return Optional.empty();
        return jpaRepository.findByNameIgnoreCase(name.trim());
    }

    public Optional<UserAccount> findByPhone(String phone) {
        if (phone == null || phone.isBlank()) return Optional.empty();
        return jpaRepository.findByPhone(phone.trim());
    }

    public Optional<UserAccount> findById(Long id) {
        if (id == null) return Optional.empty();
        return jpaRepository.findById(id);
    }

    public Collection<UserAccount> findAll() {
        return jpaRepository.findAll();
    }
}
