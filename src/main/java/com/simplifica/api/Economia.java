package com.simplifica.api;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "economias")
public class Economia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /**
     * @ManyToOne: Muitas economias podem pertencer a Uma Meta.
     * @JoinColumn(name = "meta_id"): A FK.
     * É 'nullable = false' porque uma economia DEVE estar
     * ligada a uma meta.
     */
    @ManyToOne
    @JoinColumn(name = "meta_id", nullable = false)
    private Meta meta;

    /**
     * O valor economizado.
     * O nome "economia" foi usado para bater com o
     * atributo 'name="economia"' do seu formulário HTML.
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal economia;

    @Column(nullable = false)
    private LocalDate data;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime data_criacao;

    // --- Construtores, Getters e Setters ---

    public Economia() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Meta getMeta() {
        return meta;
    }

    public void setMeta(Meta meta) {
        this.meta = meta;
    }

    public BigDecimal getEconomia() {
        return economia;
    }

    public void setEconomia(BigDecimal economia) {
        this.economia = economia;
    }

    public LocalDate getData() {
        return data;
    }

    public void setData(LocalDate data) {
        this.data = data;
    }

    public LocalDateTime getData_criacao() {
        return data_criacao;
    }

    public void setData_criacao(LocalDateTime data_criacao) {
        this.data_criacao = data_criacao;
    }
}
