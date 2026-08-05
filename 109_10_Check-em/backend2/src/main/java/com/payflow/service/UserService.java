package com.payflow.service;

import com.payflow.dto.CreateUserRequest;
import com.payflow.dto.UpdateUserRequest;
import com.payflow.enums.Role;
import com.payflow.exception.BadRequestException;
import com.payflow.exception.ProcessingException;
import com.payflow.exception.ResourceNotFoundException;
import com.payflow.model.User;
import com.payflow.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User createUser(CreateUserRequest req) {
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new BadRequestException("Email already registered: " + req.getEmail());
        }
        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setPasswordHash(req.getPassword());
        user.setRole(parseRole(req.getRole()));
        return userRepository.save(user);
    }

    public User updateUser(Long id, UpdateUserRequest req) {
        // Check user exists first
        User existing = getUser(id);

        // Check if new email is already taken by someone else
        userRepository.findByEmail(req.getEmail()).ifPresent(u -> {
            if (!u.getId().equals(id)) {
                throw new BadRequestException("Email already in use: " + req.getEmail());
            }
        });

        existing.setName(req.getName());
        existing.setEmail(req.getEmail());
        existing.setPhone(req.getPhone());

        int rows = userRepository.update(existing);
        if (rows == 0) {
            throw new ProcessingException("Update failed for user: " + id);
        }
        return existing;
    }

    public void deleteUser(Long id) {
        // Check user exists first
        getUser(id);
        int rows = userRepository.deleteById(id);
        if (rows == 0) {
            throw new ProcessingException("Delete failed for user: " + id);
        }
    }

    public User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    private Role parseRole(String role) {
        if (role == null || role.isBlank()) {
            throw new BadRequestException("role is required");
        }
        try {
            return Role.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unsupported role: " + role);
        }
    }
}