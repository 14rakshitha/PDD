package com.lawvoice.service;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PdfKnowledgeService {

    public PdfStatus status() {
        return new PdfStatus("", false, 0, "PDF disabled");
    }

    public List<String> retrieve(String query, int maxChunks) {
        return List.of();
    }

    public record PdfStatus(String pdfPath, boolean loaded, int chunks, String error) {}
}


