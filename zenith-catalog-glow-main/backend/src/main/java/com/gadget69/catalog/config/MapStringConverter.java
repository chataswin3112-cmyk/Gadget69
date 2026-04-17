package com.gadget69.catalog.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * JPA converter that serializes Map<String, String> to a JSON string column
 * and deserializes it back. Used for storing product specifications.
 */
@Converter
public class MapStringConverter implements AttributeConverter<Map<String, String>, String> {

  private static final ObjectMapper MAPPER = new ObjectMapper();

  @Override
  public String convertToDatabaseColumn(Map<String, String> attribute) {
    if (attribute == null || attribute.isEmpty()) {
      return null;
    }
    try {
      return MAPPER.writeValueAsString(attribute);
    } catch (Exception e) {
      return null;
    }
  }

  @Override
  public Map<String, String> convertToEntityAttribute(String dbData) {
    if (dbData == null || dbData.isBlank()) {
      return new LinkedHashMap<>();
    }
    try {
      return MAPPER.readValue(dbData, new TypeReference<LinkedHashMap<String, String>>() {});
    } catch (Exception e) {
      return new LinkedHashMap<>();
    }
  }
}
