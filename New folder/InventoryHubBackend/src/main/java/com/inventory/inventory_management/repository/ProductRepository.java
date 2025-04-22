package com.inventory.inventory_management.repository;
import com.inventory.inventory_management.model.Product;  // Adjust package as per your model
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
}
