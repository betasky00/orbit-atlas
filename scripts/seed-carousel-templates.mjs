// Seed script: registers the 12 Figma-based slide layouts as two
// CarouselTemplate "families" (Back = retrospective/portrait style,
// Event = news/sport recap style), each made of several SlideTemplate
// entries. Figma frame names must match exactly (see figma-plugin/README).
//
// Run manually once you have a real DATABASE_URL configured:
//   node scripts/seed-carousel-templates.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FIGMA_FILE_KEY = "blHU7FpwXCUapKnZFcgmRF";

const text = (name) => ({ name, kind: "text" });
const image = (name) => ({ name, kind: "image" });

const CAROUSEL_TEMPLATES = [
  {
        name: "Recit historique",
        editorialStyle: "Storytelling",
        description:
                "Carrousel retrospective / portrait historique, fond bleu nuit (famille back_*).",
        slides: [
          {
                    index: 0,
                    type: "hook",
                    figmaFrameName: "back_intro",
                    slots: [text("SLOT_SURTITRE"), text("SLOT_TITRE_ACCROCHE"), image("SLOT_IMAGE_1")],
          },
          {
                    index: 1,
                    type: "context",
                    figmaFrameName: "back_classique",
                    slots: [text("SLOT_TITRE"), text("SLOT_PARAGRAPHE"), image("SLOT_IMAGE_1")],
          },
          {
                    index: 2,
                    type: "photos",
                    figmaFrameName: "back_photos_1",
                    slots: [image("SLOT_IMAGE_1"), image("SLOT_IMAGE_2")],
          },
          {
                    index: 3,
                    type: "photos_legendees",
                    figmaFrameName: "back_photos_2",
                    slots: [
                                image("SLOT_IMAGE_1"),
                                text("SLOT_CREDIT_1"),
                                text("SLOT_CAPTION_1"),
                                image("SLOT_IMAGE_2"),
                                text("SLOT_CREDIT_2"),
                                text("SLOT_CAPTION_2"),
                              ],
          },
          {
                    index: 4,
                    type: "quote",
                    figmaFrameName: "back_citation",
                    slots: [
                                text("SLOT_CITATION"),
                                text("SLOT_NOM"),
                                text("SLOT_ROLE"),
                                text("SLOT_ANNEES"),
                                image("SLOT_IMAGE_1"),
                              ],
          },
          {
                    index: 5,
                    type: "data",
                    figmaFrameName: "back_stat",
                    slots: [
                                text("SLOT_CHIFFRE"),
                                text("SLOT_LABEL"),
                                text("SLOT_PARAGRAPHE"),
                                image("SLOT_IMAGE_1"),
                              ],
          },
          {
                    index: 6,
                    type: "timeline",
                    figmaFrameName: "back_frise",
                    slots: [
                                ...[1, 2, 3, 4, 5].flatMap((n) => [
                                              text(`SLOT_EVENT${n}_DATE`),
                                              text(`SLOT_EVENT${n}_DESC`),
                                            ]),
                                text("SLOT_TITRE_FINAL"),
                              ],
          },
          {
                    index: 7,
                    type: "portrait",
                    figmaFrameName: "back_portrait",
                    slots: [
                                text("SLOT_NOM"),
                                text("SLOT_ROLE"),
                                text("SLOT_DATE"),
                                text("SLOT_TITRE_SECTION"),
                                text("SLOT_PARAGRAPHE"),
                                image("SLOT_IMAGE_1"),
                              ],
          },
              ],
  },
  {
        name: "Evenement sportif",
        editorialStyle: "Storytelling",
        description:
                "Carrousel actualite / recap evenement (sport, direct), fond sombre (famille event_*).",
        slides: [
          {
                    index: 0,
                    type: "hook",
                    figmaFrameName: "event_intro",
                    slots: [text("SLOT_SURTITRE"), text("SLOT_TITRE_ACCROCHE"), image("SLOT_IMAGE_1")],
          },
          {
                    index: 1,
                    type: "context",
                    figmaFrameName: "event_basique",
                    slots: [
                                text("SLOT_TITRE"),
                                text("SLOT_PARAGRAPHE"),
                                image("SLOT_IMAGE_1"),
                                image("SLOT_IMAGE_2"),
                              ],
          },
          {
                    index: 2,
                    type: "data",
                    figmaFrameName: "event_infographie",
                    slots: [
                                text("SLOT_TITRE"),
                                text("SLOT_SOUS_TITRE"),
                                text("SLOT_STATS"),
                                image("SLOT_IMAGE_1"),
                              ],
          },
          {
                    index: 3,
                    type: "timeline",
                    figmaFrameName: "event_programme",
                    slots: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => text(`SLOT_EVENT${n}`)),
          },
              ],
  },
  ];

async function main() {
    for (const tpl of CAROUSEL_TEMPLATES) {
          let template = await prisma.carouselTemplate.findFirst({
                  where: { name: tpl.name, businessId: null },
          });

      if (!template) {
              template = await prisma.carouselTemplate.create({
                        data: {
                                    name: tpl.name,
                                    editorialStyle: tpl.editorialStyle,
                                    description: tpl.description,
                                    figmaFileKey: FIGMA_FILE_KEY,
                                    slideCount: tpl.slides.length,
                                    businessId: null,
                        },
              });
              console.log(`Created CarouselTemplate "${tpl.name}" (${template.id})`);
      } else {
              template = await prisma.carouselTemplate.update({
                        where: { id: template.id },
                        data: {
                                    editorialStyle: tpl.editorialStyle,
                                    description: tpl.description,
                                    figmaFileKey: FIGMA_FILE_KEY,
                                    slideCount: tpl.slides.length,
                        },
              });
              console.log(`Updated CarouselTemplate "${tpl.name}" (${template.id})`);
      }

      for (const slide of tpl.slides) {
              await prisma.slideTemplate.upsert({
                        where: { templateId_index: { templateId: template.id, index: slide.index } },
                        update: {
                                    type: slide.type,
                                    figmaFrameName: slide.figmaFrameName,
                                    slots: JSON.stringify(slide.slots),
                        },
                        create: {
                                    templateId: template.id,
                                    index: slide.index,
                                    type: slide.type,
                                    figmaFrameName: slide.figmaFrameName,
                                    slots: JSON.stringify(slide.slots),
                        },
              });
      }

      console.log(`  -> ${tpl.slides.length} slide(s) synced.`);
    }
}

main()
  .catch((err) => {
        console.error("Seed failed:", err);
        process.exitCode = 1;
  })
  .finally(async () => {
        await prisma.$disconnect();
  });
