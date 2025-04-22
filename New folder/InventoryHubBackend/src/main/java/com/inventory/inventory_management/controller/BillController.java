package com.inventory.inventory_management.controller;

import com.inventory.inventory_management.model.Bill;
import com.inventory.inventory_management.model.BillItem;
import com.inventory.inventory_management.service.BillService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bills")
@CrossOrigin(origins = "http://localhost:5173")
public class BillController {
    private final BillService billService;

    public BillController(BillService billService) {
        this.billService = billService;
    }

    @PostMapping
    public ResponseEntity<?> createBill(@RequestBody Map<String, Object> payload) {
        try {
            // Extract data from payload
            List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
            Double total = ((Number) payload.get("total")).doubleValue();

            if (items == null || items.isEmpty()) {
                return ResponseEntity.badRequest().body("No items provided in the bill");
            }

            // Extract product IDs and quantities from items
            List<Long> productIds = new ArrayList<>();
            List<Integer> quantities = new ArrayList<>();
            List<BillItem> billItems = new ArrayList<>();

            for (Map<String, Object> item : items) {
                Long productId = ((Number) item.get("id")).longValue();
                Integer quantity = ((Number) item.get("quantity")).intValue();
                String name = (String) item.get("name");
                Double price = ((Number) item.get("price")).doubleValue();

                productIds.add(productId);
                quantities.add(quantity);

                // Create BillItem for response
                BillItem billItem = new BillItem();
                billItem.setProductId(productId);
                billItem.setName(name);
                billItem.setQuantity(quantity);
                billItem.setPrice(price);
                billItems.add(billItem);
            }

            // Call service to create the bill
            Bill bill = billService.createBill(productIds, quantities);

            // If your service doesn't return the full bill with product details,
            // you might need to enrich the response
            if (bill.getProducts() == null || bill.getProducts().isEmpty()) {
                bill.setProducts(billItems);
            }

            if (bill.getTotal() == null || bill.getTotal() == 0) {
                bill.setTotal(total);
            }

            if (bill.getDate() == null) {
                bill.setDate(LocalDateTime.now());
            }

            return ResponseEntity.ok(bill);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error creating bill: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Bill>> getAllBills() {
        return ResponseEntity.ok(billService.getAllBills());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBillById(@PathVariable Long id) {
        try {
            Bill bill = billService.getBillById(id);
            if (bill == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(bill);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving bill: " + e.getMessage());
        }
    }
}