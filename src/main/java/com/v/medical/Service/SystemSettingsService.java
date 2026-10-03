package com.v.medical.Service;

import com.v.medical.entity.SystemSettings;
import com.v.medical.repository.SystemSettingsRepository;
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
public class SystemSettingsService {

    private static final String SETTINGS_ID = "global";

    private final SystemSettingsRepository repository;

    public SystemSettingsService(SystemSettingsRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> get() {
        return repository.findById(SETTINGS_ID)
                .map(settings -> read(settings.getValue()))
                .orElseGet(LinkedHashMap::new);
    }

    @Transactional
    public Map<String, Object> save(Map<String, Object> value) {
        SystemSettings settings = repository.findById(SETTINGS_ID).orElseGet(SystemSettings::new);
        settings.setValue(write(value));
        settings.setUpdatedAt(LocalDateTime.now());
        repository.save(settings);
        return new LinkedHashMap<>(value);
    }

    private Map<String, Object> read(String value) {
        Properties properties = new Properties();
        try {
            properties.load(new StringReader(value == null ? "" : value));
        } catch (IOException exception) {
            throw new IllegalStateException("Saved system settings are invalid");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        properties.forEach((key, propertyValue) -> result.put(String.valueOf(key), parseValue(String.valueOf(propertyValue))));
        return result;
    }

    private String write(Map<String, Object> value) {
        Properties properties = new Properties();
        value.forEach((key, propertyValue) -> properties.setProperty(key, String.valueOf(propertyValue)));
        try {
            StringWriter writer = new StringWriter();
            properties.store(writer, "MediStock system settings");
            return writer.toString();
        } catch (IOException exception) {
            throw new IllegalArgumentException("System settings could not be saved");
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
