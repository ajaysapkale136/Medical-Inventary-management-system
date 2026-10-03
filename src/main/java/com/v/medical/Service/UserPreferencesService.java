package com.v.medical.Service;

import com.v.medical.entity.UserPreferences;
import com.v.medical.repository.UserPreferencesRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Properties;

@Service
public class UserPreferencesService {

    private final UserPreferencesRepository repository;
    public UserPreferencesService(UserPreferencesRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> get(Long userId) {
        return repository.findByUserId(userId)
                .map(preferences -> read(preferences.getValue()))
                .orElseGet(LinkedHashMap::new);
    }

    @Transactional
    public Map<String, Object> save(Long userId, Map<String, Object> values) {
        UserPreferences preferences = repository.findByUserId(userId).orElseGet(UserPreferences::new);
        preferences.setUserId(userId);
        preferences.setValue(write(values));
        preferences.setUpdatedAt(LocalDateTime.now());
        repository.save(preferences);
        return new LinkedHashMap<>(values);
    }

    private Map<String, Object> read(String value) {
        Properties properties = new Properties();
        try {
            properties.load(new StringReader(value == null ? "" : value));
        } catch (IOException exception) {
            throw new IllegalStateException("Saved preferences are invalid");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        properties.forEach((key, propertyValue) -> result.put(
                String.valueOf(key), parseValue(String.valueOf(propertyValue))));
        return result;
    }

    private String write(Map<String, Object> values) {
        Properties properties = new Properties();
        values.forEach((key, value) -> properties.setProperty(key, String.valueOf(value)));
        try {
            StringWriter writer = new StringWriter();
            properties.store(writer, "MediStock user preferences");
            return writer.toString();
        } catch (IOException exception) {
            throw new IllegalArgumentException("Preferences could not be saved");
        }
    }

    private Object parseValue(String value) {
        if ("true".equalsIgnoreCase(value) || "false".equalsIgnoreCase(value)) {
            return Boolean.valueOf(value);
        }
        try {
            return Integer.valueOf(value);
        } catch (NumberFormatException ignored) {
            return value;
        }
    }
}
