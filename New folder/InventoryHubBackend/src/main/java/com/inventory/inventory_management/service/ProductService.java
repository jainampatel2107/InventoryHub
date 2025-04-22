package com.inventory.inventory_management.service;

import com.inventory.inventory_management.model.Product;
import com.inventory.inventory_management.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {
    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // ✅ Fetch all products
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // ✅ Fetch product by ID
    public Product getProductById(Long id) {
        return productRepository.findById(id).orElse(null);
    }

    // ✅ Save new product
    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    // ✅ Update product
    public Product updateProduct(Long id, Product productDetails) {
        return productRepository.findById(id).map(product -> {
            product.setName(productDetails.getName());
            product.setPrice(productDetails.getPrice());
            product.setQuantity(productDetails.getQuantity());
            return productRepository.save(product);
        }).orElse(null);
    }

    // ✅ Delete product
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
}
