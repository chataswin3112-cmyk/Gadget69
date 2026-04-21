package com.gadget69.catalog.config;

import org.springframework.boot.autoconfigure.orm.jpa.EntityManagerFactoryDependsOnPostProcessor;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class LegacySchemaRepairConfiguration extends EntityManagerFactoryDependsOnPostProcessor {

  public LegacySchemaRepairConfiguration() {
    super("legacySchemaRepair");
  }
}
