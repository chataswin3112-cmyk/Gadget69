package com.gadget69.catalog.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "customer_orders")
public class CustomerOrder {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "customer_name", nullable = false)
  private String customerName;

  @Column(nullable = false)
  private String phone;

  @Column(length = 255)
  private String email;

  @Column(nullable = false, length = 3000)
  private String address;

  @Column(nullable = false)
  private String pincode;

  @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
  private BigDecimal totalAmount;

  @Column(nullable = false)
  private String currency = "INR";

  @Column(name = "amount_paise")
  private Integer amountPaise;

  @Column(name = "payment_status", nullable = false)
  private String paymentStatus = "PENDING";

  @Column(name = "order_status", nullable = false)
  private String orderStatus = "PLACED";

  @Column(name = "razorpay_order_id")
  private String razorpayOrderId;

  @Column(name = "razorpay_payment_id")
  private String razorpayPaymentId;

  @Column(name = "razorpay_signature", length = 512)
  private String razorpaySignature;

  @Column(name = "last_razorpay_event_id")
  private String lastRazorpayEventId;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @OrderBy("id ASC")
  private List<OrderItem> items = new ArrayList<>();

  @PrePersist
  void onCreate() {
    createdAt = LocalDateTime.now();
  }
}
