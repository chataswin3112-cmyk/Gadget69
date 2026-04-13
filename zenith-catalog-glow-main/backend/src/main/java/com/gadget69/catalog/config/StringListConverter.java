package com.gadget69.catalog.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.ArrayList;
import java.util.List;

@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

  @Override
  public String convertToDatabaseColumn(List<String> attribute) {
    try {
      return OBJECT_MAPPER.writeValueAsString(attribute == null ? List.of() : attribute);
    } catch (JsonProcessingException ex) {
      return "[]";
    }
  }

  @Override
  public List<String> convertToEntityAttribute(String dbData) {
    if (dbData == null || dbData.isBlank()) {
      return new ArrayList<>();
    }
    try {
      return OBJECT_MAPPER.readValue(dbData, new TypeReference<>() {});
    } catch (JsonProcessingException ex) {
      return new ArrayList<>();
    }
  }
}
