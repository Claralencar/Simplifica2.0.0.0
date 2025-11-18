package com.simplifica.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
// Importado para o GET
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List; // Importado para o GET


@RestController
@RequestMapping("/economias")
public class EconomiaController {

    @Autowired
    private EconomiaRepository economiaRepository;

    /**
     * Precisamos do MetaRepository para:
     * 1. "Hidratar" a meta que vem do JSON.
     * 2. Atualizar o 'valorAtual' da meta.
     */
    @Autowired
    private MetaRepository metaRepository;

    // --- CREATE (Criar) ---
    /**
     * @PostMapping: Mapeia requisições HTTP POST para /economias.
     * Este é o método que salva a economia e ATUALIZA A META.
     */
    @PostMapping
    public ResponseEntity<Economia> criarEconomia(@RequestBody Economia economia) {

        // --- 1. Validar e "Hidratar" a Meta (seu padrão) ---
        
        // Validação: Garante que o JSON enviou um ID de meta
        if (economia.getMeta() == null || economia.getMeta().getId() == null) {
            throw new RuntimeException("Uma meta é obrigatória para salvar uma economia.");
        }

        // Busca a meta completa no banco
        Integer metaId = economia.getMeta().getId();
        Meta meta = metaRepository.findById(metaId)
            .orElseThrow(() -> new RuntimeException("Meta não encontrada com id: " + metaId));

        // --- 2. Lógica de Negócio: Atualizar o valorAtual da Meta ---
        
        BigDecimal valorEconomizado = economia.getEconomia();
        
        // Garante que o valor é válido
        if (valorEconomizado == null || valorEconomizado.compareTo(BigDecimal.ZERO) <= 0) {
             throw new RuntimeException("O valor da economia deve ser positivo.");
        }

        // Garante que a data foi enviada
        if (economia.getData() == null) {
            throw new RuntimeException("A data da economia é obrigatória.");
        }

        BigDecimal valorAtualDaMeta = meta.getValorAtual();
        meta.setValorAtual(valorAtualDaMeta.add(valorEconomizado));

        // --- 3. Salvar os Objetos ---
        
        // Salva a meta (com o valorAtual atualizado)
        metaRepository.save(meta);

        // Anexa a meta completa à economia antes de salvá-la
        economia.setMeta(meta);
        Economia novaEconomia = economiaRepository.save(economia);

        return ResponseEntity.status(HttpStatus.CREATED).body(novaEconomia);
    }

    // --- READ (Ler Todos) ---
    /**
     * @GetMapping: Mapeia requisições HTTP GET para /economias.
     * Adicionei este método para seguir o padrão do seu TransacaoController.
     */
    @GetMapping
    public ResponseEntity<List<Economia>> listarEconomias() {
        List<Economia> economias = (List<Economia>) economiaRepository.findAll();
        return ResponseEntity.ok(economias);
    }

    // Nota: PUT e DELETE para Economia não foram adicionados
    // pois exigiriam uma lógica de "rollback" (subtrair do valorAtual da meta)
    // que é mais segura de fazer com uma Camada de Serviço (Service Layer).
}
