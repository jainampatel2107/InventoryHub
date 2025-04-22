package com.inventory.inventory_management.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "bills")
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BillItem> products;

    @Column(nullable = false)
    private Double total;

    @Column(nullable = false)
    private LocalDateTime date;

    // Constructors
    public Bill() {
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<BillItem> getProducts() {
        return products;
    }

    public void setProducts(List<BillItem> products) {
        this.products = products;

        // Maintain bidirectional relationship
        if (products != null) {
            for (BillItem item : products) {
                item.setBill(this);
            }
        }
    }

    public Double getTotal() {
        return total;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }
}