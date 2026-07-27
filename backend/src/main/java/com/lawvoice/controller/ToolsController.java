package com.lawvoice.controller;

import com.lawvoice.model.LegalDeadline;
import com.lawvoice.model.RtiApplication;
import com.lawvoice.service.ToolsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(originPatterns = "*")
public class ToolsController {

    private final ToolsService toolsService;

    public ToolsController(ToolsService toolsService) {
        this.toolsService = toolsService;
    }

    // --- RTI Application Endpoints ---
    @PostMapping("/rti/generate")
    public ResponseEntity<RtiApplication> generateRti(@RequestBody RtiApplication rti) {
        RtiApplication saved = toolsService.saveRtiDraft(rti);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/rti/my-drafts")
    public ResponseEntity<List<RtiApplication>> getMyRtiDrafts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone) {
        return ResponseEntity.ok(toolsService.getRtiDraftsForUser(name, phone));
    }

    // --- Legal Deadline Endpoints ---
    @PostMapping("/deadlines/create")
    public ResponseEntity<LegalDeadline> createDeadline(@RequestBody LegalDeadline deadline) {
        LegalDeadline saved = toolsService.createLegalDeadline(deadline);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/deadlines/my-deadlines")
    public ResponseEntity<List<LegalDeadline>> getMyDeadlines(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone) {
        return ResponseEntity.ok(toolsService.getDeadlinesForUser(name, phone));
    }

    @PutMapping("/deadlines/{id}/status")
    public ResponseEntity<LegalDeadline> updateDeadlineStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "Completed");
        return toolsService.updateStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
