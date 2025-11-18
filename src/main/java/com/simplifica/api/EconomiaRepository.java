package com.simplifica.api;

import org.springframework.data.repository.CrudRepository;

public interface EconomiaRepository extends CrudRepository<Economia, Integer> {
    // Por enquanto, não precisa de métodos customizados.
    // O CrudRepository já tem .save(), .findById(), .findAll(), etc.
}
