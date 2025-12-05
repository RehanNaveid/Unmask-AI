package com.example.Unmask.service;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class PdfImageService {

    public List<Path> convertPdfToImages(Path pdfPath, Path outputDir) {
        try {
            Files.createDirectories(outputDir);

            try (PDDocument document = PDDocument.load(pdfPath.toFile())) {
                PDFRenderer renderer = new PDFRenderer(document);
                int pageCount = document.getNumberOfPages();
                List<Path> images = new ArrayList<>();

                for (int i = 0; i < pageCount; i++) {
                    BufferedImage image = renderer.renderImageWithDPI(i, 300);
                    Path out = outputDir.resolve("page-" + (i + 1) + ".png");
                    ImageIO.write(image, "png", out.toFile());
                    images.add(out);
                }
                return images;
            }
        } catch (Exception e) {
            log.error("Failed to convert PDF to images", e);
            throw new RuntimeException("PDF->image conversion failed: " + e.getMessage());
        }
    }
}

