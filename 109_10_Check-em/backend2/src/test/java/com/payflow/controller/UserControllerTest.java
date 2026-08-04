package com.payflow.controller;

import com.payflow.dto.CreateUserRequest;
import com.payflow.dto.UpdateUserRequest;
import com.payflow.enums.Role;
import com.payflow.model.User;
import com.payflow.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    private UserController userController;

    @BeforeEach
    void setUp() {
        userController = new UserController(userService);
    }

    @Test
    void endpoint_post_api_users_createUser() {
        CreateUserRequest req = new CreateUserRequest();
        req.setName("Alice");
        req.setEmail("alice@demo.com");
        req.setPhone("+910000000000");
        req.setPassword("pw");
        req.setRole("CUSTOMER");

        when(userService.createUser(req)).thenReturn(sampleUser(2L, "Alice"));

        ResponseEntity<User> response = userController.createUser(req);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(2L, response.getBody().getId());
        verify(userService).createUser(req);
    }

    @Test
    void endpoint_get_api_users_id_getUser() {
        when(userService.getUser(2L)).thenReturn(sampleUser(2L, "Alice"));

        ResponseEntity<User> response = userController.getUser(2L);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("Alice", response.getBody().getName());
        verify(userService).getUser(2L);
    }

    @Test
    void endpoint_get_api_users_getAllUsers() {
        when(userService.getAllUsers()).thenReturn(Collections.singletonList(sampleUser(2L, "Alice")));

        ResponseEntity<List<User>> response = userController.getAllUsers();

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        verify(userService).getAllUsers();
    }

    @Test
    void endpoint_put_api_users_id_updateUser() {
        UpdateUserRequest req = new UpdateUserRequest();
        req.setName("Alice Updated");
        req.setEmail("alice.updated@demo.com");
        req.setPhone("+910000000001");

        when(userService.updateUser(2L, req)).thenReturn(sampleUser(2L, "Alice Updated"));

        ResponseEntity<User> response = userController.updateUser(2L, req);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("Alice Updated", response.getBody().getName());
        verify(userService).updateUser(2L, req);
    }

    @Test
    void endpoint_delete_api_users_id_deleteUser() {
        ResponseEntity<String> response = userController.deleteUser(2L);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("User 2 deleted successfully", response.getBody());
        verify(userService).deleteUser(2L);
    }

    private User sampleUser(Long id, String name) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setEmail("sample@demo.com");
        user.setPhone("+910000000000");
        user.setRole(Role.CUSTOMER);
        return user;
    }
}
