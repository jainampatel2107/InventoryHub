package com.inventory.inventory_management.service;

import com.inventory.inventory_management.model.Bill;
import com.inventory.inventory_management.model.BillItem;
import com.inventory.inventory_management.model.Product;
import com.inventory.inventory_management.repository.BillRepository;
import com.inventory.inventory_management.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class BillServiceImpl implements BillService {

    private final BillRepository billRepository;
    private final ProductRepository productRepository;

    @Autowired
    public BillServiceImpl(BillRepository billRepository, ProductRepository productRepository) {
        this.billRepository = billRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public Bill createBill(List<Long> productIds, List<Integer> quantities) {
        if (productIds.size() != quantities.size()) {
            throw new IllegalArgumentException("Product IDs and quantities lists must be of the same size");
        }

        Bill bill = new Bill();
        bill.setDate(LocalDateTime.now());

        List<BillItem> billItems = new ArrayList<>();
        double total = 0.0;

        for (int i = 0; i < productIds.size(); i++) {
            Long productId = productIds.get(i);
            Integer quantity = quantities.get(i);

            Optional<Product> productOpt = productRepository.findById(productId);
            if (productOpt.isEmpty()) {
                throw new IllegalArgumentException("Product with ID " + productId + " not found");
            }

            Product product = productOpt.get();

            // Check if there's enough stock
            if (product.getQuantity() < quantity) {
                throw new IllegalArgumentException("Not enough stock for product " + product.getName());
            }

            // Update product stock
            product.setQuantity(product.getQuantity() - quantity);
            productRepository.save(product);

            // Create bill item
            BillItem billItem = new BillItem();
            billItem.setProductId(productId);
            billItem.setName(product.getName());
            billItem.setPrice(product.getPrice());
            billItem.setQuantity(quantity);
            billItem.setBill(bill);

            billItems.add(billItem);

            // Add to total
            total += product.getPrice() * quantity;
        }

        bill.setProducts(billItems);
        bill.setTotal(total);

        return billRepository.save(bill);
    }

    @Override
    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }

    @Override
    public Bill getBillById(Long id) {
        return billRepository.findById(id).orElse(null);
    }
}
