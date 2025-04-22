package com.inventory.inventory_management.service;

import com.inventory.inventory_management.model.Bill;
import java.util.List;

public interface BillService {
    Bill createBill(List<Long> productIds, List<Integer> quantities);
    List<Bill> getAllBills();
    Bill getBillById(Long id);
}