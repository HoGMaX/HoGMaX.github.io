-- ARTISTIC initial seed
-- Generated from data/prompts.json
-- DO NOT EDIT MANUALLY

ALTER TABLE prompts ADD COLUMN prompt TEXT NOT NULL DEFAULT '';


CREATE TABLE prompt_translations_new (
  prompt_id TEXT NOT NULL,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (prompt_id, language),
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);


INSERT INTO prompt_translations_new (
  prompt_id,
  language,
  title,
  description
)
SELECT
  prompt_id,
  language,
  title,
  description
FROM prompt_translations;

DROP TABLE prompt_translations;

ALTER TABLE prompt_translations_new
RENAME TO prompt_translations;


CREATE INDEX idx_prompt_translations_language
ON prompt_translations(language);


INSERT OR IGNORE INTO categories (id, slug, name, created_at, updated_at) VALUES ('character', 'character', 'Character', '2026-09-22T07:42:03.937Z', '2026-09-22T07:42:03.937Z');

INSERT OR REPLACE INTO prompts (id, category_id, type, status, order_index, created_at, updated_at, copy_count, prompt) VALUES ('medieval-fantasy', 'character', 'vertical', 'published', 1, '2026-09-14', '2026-09-14', 0, 'CREATE A NEW ORIGINAL CHARACTER ILLUSTRATION
USING THE PROVIDED PHOTO AS THE PRIMARY HUMAN REFERENCE.

The uploaded photo is ONLY a reference for the person''s identity and physical appearance.
Preserve the recognizable facial characteristics of the person while completely transforming
the subject into the artistic world, clothing, pose, and visual language described below.

==================================================
PRIMARY GOAL
==================================================

Create a highly detailed medieval-fantasy character poster with the same artistic spirit,
material quality, composition language, and atmosphere as the MASTER REFERENCE.

The result must look like a handcrafted traditional fantasy illustration on aged parchment:
a sophisticated fusion of watercolor painting, fine ink drawing, medieval engraving,
architectural sketching, cross-hatching, and controlled pigment splashes.

The CHARACTER is the primary visual focal point.

The entire character must belong to ONE CONSISTENT ARTISTIC MEDIUM.

The face, skin, hair, clothing, armor, hands, boots and environment
must all appear to have been created by the SAME traditional illustrator
using the SAME ink-and-watercolor technique.

The final image must NOT look like:
- a modern digital painting
- a 3D render
- a video game screenshot
- a photographic portrait
- photorealistic skin
- anime
- comic-book art
- generic AI fantasy artwork

It must look like an exceptionally detailed traditional mixed-media illustration
painted and drawn directly onto old textured paper.

==================================================
REFERENCE ROLES
==================================================

The uploaded human photo determines:
- identity
- recognizable facial characteristics
- facial proportions
- hairstyle
- hair characteristics
- natural gender presentation
- general physical build

The MASTER REFERENCE determines:
- artistic style
- illustration technique
- color palette
- parchment material
- watercolor behavior
- ink linework
- medieval atmosphere
- architectural treatment
- pigment splashes
- visual density
- composition philosophy

DO NOT copy the exact person, exact face, exact costume, or exact character
from the MASTER REFERENCE.

Transfer the VISUAL LANGUAGE, not the specific individual.

==================================================
IDENTITY AND FACE
==================================================

Preserve the recognizable identity of the person from the uploaded photo.

Maintain:
- recognizable facial structure
- natural face proportions
- eye shape
- eyebrow structure
- nose structure
- lips
- jawline
- cheek structure
- natural facial asymmetry
- recognizable hair characteristics

The person''s recognizable identity must remain present,
but the rendering of the face MUST be fully transformed into the same
traditional illustrated medium as the rest of the character.

IMPORTANT:

DO NOT render the face as a clean digital portrait.

DO NOT render realistic photographic skin.

DO NOT leave the face smoother, sharper, cleaner, or more realistic
than the clothing and armor.

The face must NOT look like a photograph placed inside an illustration.

The face must look DRAWN AND PAINTED.

==================================================
FACE STYLE INTEGRATION — CRITICAL
==================================================

The face and skin must receive the SAME visual treatment as the rest of the illustration.

Use visible:
- fine ink contour lines
- delicate pen strokes
- subtle cross-hatching
- engraved-style shadow marks
- transparent watercolor washes
- broken watercolor tonal transitions
- irregular pigment accumulation
- dry-brush texture
- subtle paper grain visible through the skin
- tiny hand-drawn imperfections

Use fine ink marks to describe:
- eyebrows
- eyelids
- nose structure
- lips
- cheek planes
- jawline
- facial shadows

Use watercolor washes to build:
- forehead
- cheeks
- nose
- jaw
- neck
- subtle facial volume

The skin should contain subtle variation in pigment density,
not a perfectly smooth digital gradient.

Facial shadows should be constructed from layered watercolor,
fine hatching and ink marks rather than smooth CGI shading.

The face should contain the same controlled imperfections
visible throughout the clothing, leather, stone and architecture.

The illustration texture must visibly enter the face itself.

IMPORTANT:

The skin must NOT have:
- perfectly smooth gradients
- plastic texture
- glossy skin
- photographic pores
- hyper-realistic skin rendering
- modern beauty-retouching
- excessive sharpness
- clean digital airbrushing

Instead, create a painterly illustrated face with:
fine linework,
subtle ink hatching,
watercolor pigment,
paper absorption,
slightly irregular edges,
and visible traditional-media texture.

The eyes must also be illustrated.

Do NOT make the eyes look like photographic glass.

Use delicate ink definition around the eyes,
subtle watercolor tonal variation,
and restrained highlights.

The face should remain recognizable,
but it must visually belong to the SAME ARTWORK.

==================================================
FACE / BODY STYLE CONSISTENCY
==================================================

The following principle has the highest priority:

THE FACE MUST NOT LOOK MORE PHOTOREALISTIC THAN THE BODY.

The same artistic treatment must continue seamlessly
from the face into the neck, shoulders, clothing and armor.

There must be NO visible stylistic boundary between:
- face and neck
- skin and hood
- skin and armor
- face and surrounding watercolor

The face should look as though it was physically painted
with the same brushes and ink used to create the rest of the character.

==================================================
HEAD / NECK / BODY PROPORTIONS
==================================================

CRITICAL ANATOMICAL REQUIREMENT:

Maintain realistic adult human proportions.

The head must be correctly scaled relative to:
- neck
- shoulders
- torso
- arms
- legs
- overall body height

Do NOT enlarge the head to make the face more prominent.

Do NOT create a disproportionately large head.

Do NOT make the neck unnaturally short or compressed.

The neck must connect naturally from the jaw into the shoulders and torso.

The hood must FOLLOW the actual head shape rather than making the head appear oversized.

The hood may create visual volume around the head,
but it must NOT increase the perceived anatomical size of the skull.

The shoulders must have believable width relative to the head.

The torso must remain visually dominant enough to support the character''s proportions.

The character should feel like a physically believable adult human
wearing fantasy clothing and armor.

Avoid:
- oversized head
- miniature body
- tiny shoulders
- extremely short neck
- compressed neck
- head floating above torso
- oversized hood
- distorted facial proportions
- exaggerated facial scale

==================================================
GENDER-NEUTRAL CHARACTER ADAPTATION
==================================================

Automatically adapt the character naturally to the uploaded person''s gender and physique.

If the reference is male:
create natural masculine anatomy, proportions, clothing fit, shoulders,
limb structure, and silhouette.

If the reference is female:
create natural feminine anatomy, proportions, clothing fit, shoulders,
limb structure, and silhouette.

Do not force the subject into the anatomy or body proportions of the MASTER REFERENCE.

The person''s physical identity comes from the uploaded photo.

The MASTER REFERENCE provides only the artistic world and visual language.

==================================================
CHARACTER DESIGN
==================================================

Create an original medieval-fantasy adventurer / assassin-inspired character.

Use layered medieval clothing combining:
- weathered cloth
- dark leather
- belts
- straps
- metal buckles
- fitted armor pieces
- leather bracers
- worn boots
- layered fabric
- hood or cloak elements

The costume should feel historically inspired but fantastical.

Use believable construction and physically logical layering.

Primary materials:
- warm ivory / aged parchment fabric
- muted crimson cloth
- dark brown leather
- aged metal
- charcoal-black details

Avoid excessive ornamentation.

==================================================
POSE
==================================================

Create a dynamic seated / resting adventurer pose on old stone architecture.

The character sits naturally on stone steps or masonry.

One leg may be positioned closer to the viewer to create controlled depth and perspective.

The pose must have:
- believable weight distribution
- realistic hip placement
- anatomically correct knees
- anatomically correct ankles
- natural foot orientation
- physically plausible limb connections

The body must feel physically grounded on the stone surface.

Do not sacrifice anatomy for artistic texture.

==================================================
LEGS — CRITICAL ANATOMICAL AND SILHOUETTE REQUIREMENT
==================================================

BOTH LEGS MUST REMAIN COMPLETELY READABLE.

Every leg must have a clearly defined continuous anatomical silhouette
from hip/thigh through knee, calf, ankle, and boot.

The full volume of each leg must remain visually distinguishable.

Especially the LEG ON THE RIGHT SIDE OF THE IMAGE:

Do NOT allow this leg to dissolve into:
- watercolor splashes
- parchment texture
- background architecture
- cloak texture
- abstract ink patterns
- decorative linework

The entire leg must remain a solid, clearly readable physical form.

The leg must have a continuous visible contour.

The outer silhouette of the thigh, knee, calf, ankle, and boot
must remain clearly separated from the background.

Watercolor texture may exist ON the leg,
but must NEVER replace the leg''s anatomical structure.

Textures must FOLLOW the cylindrical volume and perspective of the limb.

The leg must read first as:
1. human leg
2. clothing / armor
3. painted texture

NOT the other way around.

Maintain clear visual separation between:
- leg and cloak
- leg and stone
- leg and background
- boot and surrounding splashes

Do not allow background ink marks to continue through the leg
as if the leg were transparent.

Do not merge the leg contour with surrounding watercolor splatters.

The boots must have a complete recognizable shape,
with visible toe, sole, heel, ankle, and shaft.

Both legs must remain anatomically connected to the torso.

No missing sections.
No fragmented limbs.
No semi-transparent limbs.
No disappearing lower legs.
No melted boots.
No ambiguous leg boundaries.

==================================================
HANDS AND ARMS
==================================================

Maintain anatomically correct hands.

Each hand must have:
- five fingers
- natural finger lengths
- believable joints
- correct palm structure
- physically plausible positioning

Do not allow hands to dissolve into watercolor texture.

Armor and bracers must follow the actual anatomy of the arms.

==================================================
BACKGROUND WORLD
==================================================

Create a detailed medieval Central European fantasy city.

Include:
- Gothic church towers
- distant spires
- medieval rooftops
- old stone buildings
- narrow architectural silhouettes
- stone bridge elements
- distant towers
- layered historic city architecture

The architecture must remain secondary to the character.

The background must be lighter and less visually dense than the character.

Architecture should gradually dissolve into:
- watercolor washes
- faded ink
- parchment
- pigment particles

The environment must share exactly the same traditional mixed-media technique
as the character.

==================================================
HERALDIC BANNER
==================================================

Include a large weathered medieval banner in the background.

The banner should be:
- aged
- torn
- stained
- hand-painted
- slightly worn

Use a restrained deep crimson and ivory heraldic design
with a simple strong medieval emblem.

The banner supports the composition but must not overpower the character.

==================================================
ART STYLE
==================================================

MASTER VISUAL STYLE:

traditional medieval fantasy illustration
hand-painted watercolor
fine pen-and-ink drawing
old European engraving
medieval manuscript aesthetics
architectural ink sketching
delicate cross-hatching
engraved shadow textures
dry-brush marks
transparent watercolor washes
pigment bleeding
organic ink irregularities
handmade illustration imperfections

The most important stylistic characteristic is
VISIBLE TRADITIONAL MEDIA TEXTURE.

Every major surface should show evidence of ink, watercolor or paper.

This includes:
- skin
- face
- hair
- cloth
- leather
- armor
- stone
- architecture

Avoid isolated areas of smooth digital rendering.

Use sophisticated line-weight variation.

Fine lines for:
- distant architecture
- background details
- subtle textures

Stronger controlled contours for:
- face
- body
- clothing
- armor
- legs
- boots

Fine engraved hatching should describe:
- leather
- metal
- stone
- cloth
- hair
- shadows
- facial planes

==================================================
PAPER
==================================================

The entire artwork exists on aged warm ivory parchment.

The paper must have:
- visible fibers
- subtle stains
- faded areas
- tiny imperfections
- watercolor absorption
- irregular pigment edges
- faint cracks
- archival paper character

The background must NOT be a flat beige fill.

The actual paper texture must remain visible.

==================================================
WATERCOLOR AND INK SPLASHES
==================================================

Use controlled watercolor and ink splashes throughout the composition.

Palette:
- diluted gray
- charcoal-black ink
- muted crimson
- dark brown
- faded beige

Include:
- irregular ink droplets
- pigment particles
- organic splatters
- faded watercolor clouds
- thin ink marks
- circular brush traces
- loose pigment fragments

The splashes must look hand-painted.

They must NOT look like digital grunge overlays.

IMPORTANT:

Watercolor splashes may dissolve the EDGES OF THE BACKGROUND,
but they must NOT dissolve the anatomy of the MAIN CHARACTER.

The character''s body silhouette must always remain readable.

==================================================
CHARACTER / BACKGROUND SEPARATION
==================================================

The character must have stronger visual definition than the environment.

Character:
high detail
stronger contours
clear anatomy
dense material texture
controlled shadows

Background:
lighter
fainter
lower contrast
more atmospheric
more dissolved into parchment

Never allow background texture to visually overpower
or merge with the character''s limbs.

Maintain clear separation around:
- head
- shoulders
- arms
- hands
- both legs
- boots
- torso

==================================================
COLOR PALETTE
==================================================

Strict restrained palette:

warm ivory
aged beige
desaturated gray
charcoal black
dark brown
muted crimson
faded burgundy

Very limited saturation.

Crimson is an accent color.

No neon colors.
No bright modern colors.
No glossy digital gradients.

==================================================
LIGHTING
==================================================

Soft diffused natural illumination.

Subtle warm light on the face.

Gentle shadows created through:
- watercolor layering
- ink hatching
- tonal washes

No CGI lighting.

No strong artificial rim light.

No plastic skin.

==================================================
DEPTH
==================================================

Create dimensionality through:
- overlapping forms
- perspective
- line-weight variation
- watercolor tonal depth
- shadow layering
- architectural scale
- foreground / midground / background separation

The character should have more dimensional presence
than the architecture.

The character may feel subtly three-dimensional,
but must remain clearly a traditional illustration.

==================================================
OVERALL ATMOSPHERE
==================================================

The image should feel:

ancient
mysterious
elegant
adventurous
historical
slightly melancholic
handcrafted
cinematic
medieval
refined

The final result should resemble a premium collectible medieval fantasy
illustration printed on aged parchment.

==================================================
FINAL PRIORITY RULE
==================================================

PRIORITY ORDER:

1. Recognizable identity from the uploaded photo
2. FACE FULLY INTEGRATED INTO THE ILLUSTRATION STYLE
3. Natural human anatomy
4. Correct head-to-body proportions
5. Clear complete body silhouette
6. Both legs fully readable from hip to boot
7. Character/background separation
8. Consistent traditional watercolor + ink treatment across THE ENTIRE PERSON
9. Aged parchment material
10. Medieval European atmosphere
11. Decorative pigment splashes

CRITICAL:

THE FACE MUST NOT BE THE ONLY PHOTOREALISTIC OR SMOOTH PART OF THE IMAGE.

The face must contain visible traditional ink and watercolor characteristics.

The identity should come from the underlying facial structure,
NOT from photographic rendering.

If artistic texture conflicts with anatomy,
ANATOMY ALWAYS WINS.

If watercolor splashes conflict with the character silhouette,
THE CHARACTER SILHOUETTE ALWAYS WINS.

If the hood conflicts with head proportions,
REALISTIC HEAD PROPORTIONS ALWAYS WIN.

If facial realism conflicts with artistic consistency,
ARTISTIC CONSISTENCY WINS WHILE PRESERVING RECOGNIZABLE IDENTITY.

The final image must look like this person was originally drawn
inside this medieval watercolor world,
not photographed and composited into it.');
INSERT OR REPLACE INTO prompt_translations (prompt_id, language, title, description) VALUES ('medieval-fantasy', 'en', 'Medieval Fantasy Character', 'Transform a personal photo into a traditional medieval watercolor and ink character illustration.');
INSERT OR REPLACE INTO prompt_translations (prompt_id, language, title, description) VALUES ('medieval-fantasy', 'uk', 'Medieval Fantasy Character', 'Transform a personal photo into a traditional medieval watercolor and ink character illustration.');
