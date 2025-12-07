package com.example.Unmask.security;
import com.example.Unmask.entity.HrUser;
import com.example.Unmask.repository.HrUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HrUserDetailsService implements UserDetailsService {

    private final HrUserRepository hrUserRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        HrUser user = hrUserRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities(user.getRole())   // "ROLE_HR"
                .build();
    }
}
