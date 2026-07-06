-- Seed the coach library from the reviewed starter CSVs.
-- Safe to run once; guarded so it only inserts into EMPTY tables (no duplicates).
-- created_by is set to the coach account automatically.

DO $$
DECLARE coach_uuid uuid;
BEGIN
  SELECT id INTO coach_uuid FROM public.clients WHERE role IN ('coach','admin') LIMIT 1;
  IF coach_uuid IS NULL THEN RAISE EXCEPTION 'No coach account found'; END IF;

  IF (SELECT count(*) FROM public.exercises) = 0 THEN
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Bodyweight Squat','Legs','None',NULL,'Feet shoulder-width; sit back into hips; knees track over toes',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Chair-Assisted Squat','Legs','Chair',NULL,'Tap the chair lightly; keep chest up; drive through heels',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Glute Bridge','Glutes','None',NULL,'Squeeze glutes at the top; don''t arch the lower back',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Reverse Lunge','Legs','None',NULL,'Step back; front knee over ankle; push through front heel',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Step-Ups','Legs','Step or stair',NULL,'Full foot on the step; control the way down',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Wall Push-Up','Chest','Wall',NULL,'Body in one line; elbows about 45 degrees from ribs',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Incline Push-Up','Chest','Table or bench',NULL,'Higher surface = easier; keep core tight',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Knee Push-Up','Chest','Mat',NULL,'Hips in line with shoulders and knees',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Bent-Over Row (Band)','Back','Resistance band',NULL,'Pull elbows toward hips; squeeze shoulder blades',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Bent-Over Row (Dumbbell)','Back','Dumbbells',NULL,'Flat back; pull to the waist not the chest',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Lat Pulldown (Band)','Back','Resistance band',NULL,'Anchor high; pull elbows down and back',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Overhead Press (Dumbbell)','Shoulders','Dumbbells',NULL,'Ribs down; press without leaning back',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Lateral Raise','Shoulders','Dumbbells',NULL,'Lead with elbows; stop at shoulder height',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Bicep Curl','Arms','Dumbbells',NULL,'Elbows pinned to sides; control the lowering',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Tricep Kickback','Arms','Dumbbells',NULL,'Upper arm still; extend only the forearm',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Plank','Core','Mat',NULL,'Straight line ear to ankle; breathe; don''t sag hips',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Knee Plank','Core','Mat',NULL,'Same line from knees; squeeze glutes',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Side Plank (Knees)','Core','Mat',NULL,'Stack shoulders; lift hips; hold steady',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Dead Bug','Core','Mat',NULL,'Lower back pressed down; slow opposite arm and leg',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Bird Dog','Core','Mat',NULL,'Long spine; reach without rotating hips',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Cat-Cow','Mobility','Mat',NULL,'Move with the breath; segment the spine',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Child''s Pose','Mobility','Mat',NULL,'Knees wide; sink hips back; long arms',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Hip Flexor Stretch','Mobility','Mat',NULL,'Tall posture; gentle forward shift; no pain',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Hamstring Stretch','Mobility','Mat or strap',NULL,'Soft knee; hinge from the hip',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Thoracic Rotation','Mobility','Mat',NULL,'Follow the moving hand with your eyes',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Brisk Walk','Cardio','None',NULL,'Pace where you can talk but not sing',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Incline Walk','Cardio','Treadmill or hill',NULL,'Lean slightly forward from ankles; relaxed arms',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Cycling (Easy)','Cardio','Cycle',NULL,'Smooth cadence; conversational effort',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Marching in Place','Cardio','None',NULL,'Lift knees to hip height; swing arms',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Low-Impact Jumping Jack','Cardio','None',NULL,'Step side-to-side instead of jumping',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Stair Climb','Cardio','Stairs',NULL,'Use the rail if needed; steady breathing',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Farmer''s Carry','Full body','Dumbbells',NULL,'Tall posture; ribs stacked over hips; grip firm',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Kettlebell Deadlift','Full body','Kettlebell or dumbbell',NULL,'Hinge at hips; flat back; stand tall',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Wall Sit','Legs','Wall',NULL,'Thighs toward parallel; breathe through the hold',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Calf Raise','Legs','None',NULL,'Pause at the top; lower slowly',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Superman Hold','Back','Mat',NULL,'Lift chest and thighs gently; look down',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Shoulder Taps','Core','Mat',NULL,'Wide feet; minimal hip sway',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Standing Balance (Single Leg)','Balance','None',NULL,'Soft knee; eyes on a fixed point',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Box Breathing','Recovery','None',NULL,'Inhale 4 - hold 4 - exhale 4 - hold 4',coach_uuid);
    INSERT INTO public.exercises (name,muscle_group,equipment,video_url,cues,created_by) VALUES ('Legs Up the Wall','Recovery','Wall',NULL,'5 to 10 minutes; slow nasal breathing',coach_uuid);
  END IF;

  IF (SELECT count(*) FROM public.foods) = 0 THEN
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Moong Dal Chilla','2 medium (120g)',220,12,28,6,true,'breakfast, high-protein',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Besan Chilla','2 medium (120g)',240,11,26,9,true,'breakfast',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Vegetable Poha','1 plate (150g)',250,5,45,6,true,'breakfast',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Vegetable Upma','1 bowl (150g)',230,6,38,6,true,'breakfast',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Idli with Sambar','3 idli + 1 katori',290,10,52,4,true,'breakfast, light',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Masala Oats','1 bowl (200g)',220,8,35,5,true,'breakfast, fiber',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Vegetable Dalia','1 bowl (200g)',200,7,36,3,true,'breakfast, fiber',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Paneer Bhurji','1 katori (100g)',260,14,6,20,true,'high-protein, breakfast',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Boiled Eggs','2 whole',140,12,1,10,false,'high-protein, breakfast',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Egg Bhurji','2 eggs',180,13,3,13,false,'high-protein, breakfast',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Greek Yogurt (Plain)','1 katori (150g)',90,10,6,2,true,'snack, high-protein',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Sprouts Salad','1 katori (100g)',100,8,13,2,true,'snack, high-protein, fiber',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Roasted Chana','1 handful (30g)',110,6,17,2,true,'snack',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Fruit Bowl (Mixed)','1 bowl (150g)',80,1,20,0,true,'snack',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Apple','1 medium',80,0,21,0,true,'snack',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Banana','1 medium',105,1,27,0,true,'snack, pre-workout',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Buttermilk (Chaas)','1 glass (250ml)',50,3,6,1,true,'drink, light',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Coconut Water','1 glass (250ml)',45,0,11,0,true,'drink',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Phulka Roti','1 roti (35g)',85,3,17,1,true,'lunch, dinner',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Jowar Roti','1 roti (45g)',110,3,22,1,true,'lunch, dinner, gluten-free',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Bajra Roti','1 roti (45g)',115,3,22,2,true,'lunch, dinner, gluten-free',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Steamed Rice','1 katori (100g)',130,3,28,0,true,'lunch, dinner',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Brown Rice','1 katori (100g)',120,3,25,1,true,'lunch, dinner, fiber',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Dal Tadka','1 katori (150g)',160,8,20,5,true,'lunch, dinner, protein',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Rajma Curry','1 katori (150g)',180,9,25,4,true,'lunch, dinner, protein',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Chole','1 katori (150g)',210,9,28,7,true,'lunch, dinner, protein',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Palak Paneer','1 katori (150g)',240,11,8,18,true,'lunch, dinner',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Mixed Veg Sabzi','1 katori (120g)',110,3,12,6,true,'lunch, dinner',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Bhindi Sabzi','1 katori (100g)',90,2,9,5,true,'lunch, dinner',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Lauki Sabzi','1 katori (120g)',70,2,8,4,true,'lunch, dinner, light',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Paneer Tikka','6 pieces (100g)',230,14,8,16,true,'high-protein, dinner',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Grilled Chicken Breast','100g',165,31,0,4,false,'high-protein, lunch, dinner',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Chicken Curry (Homestyle)','1 katori (150g)',220,20,6,13,false,'lunch, dinner, protein',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Fish Curry (Homestyle)','1 katori (150g)',190,18,6,10,false,'lunch, dinner, protein',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Grilled Fish','100g',140,22,0,5,false,'high-protein, dinner',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Vegetable Khichdi','1 bowl (200g)',230,8,38,5,true,'dinner, light',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Curd (Dahi)','1 katori (100g)',60,3,5,3,true,'lunch, side',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Cucumber Salad','1 katori (100g)',25,1,4,0,true,'side, fiber',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Vegetable Soup (Clear)','1 bowl (200ml)',60,2,10,1,true,'dinner, light',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Chicken Soup (Clear)','1 bowl (200ml)',90,10,5,3,false,'dinner, light',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Peanut Butter','1 tbsp (16g)',95,4,3,8,true,'snack, healthy-fat',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Mixed Nuts','1 small handful (20g)',120,4,4,10,true,'snack, healthy-fat',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Makhana (Roasted)','1 katori (25g)',90,3,17,1,true,'snack, light',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Tofu Stir-Fry','1 katori (120g)',140,12,5,9,true,'high-protein, dinner',coach_uuid);
    INSERT INTO public.foods (name,portion,calories,protein,carbs,fats,is_veg,tags,created_by) VALUES ('Quinoa Pulao','1 bowl (150g)',210,7,33,5,true,'lunch, fiber',coach_uuid);
  END IF;
END $$;

SELECT (SELECT count(*) FROM public.exercises) AS exercises, (SELECT count(*) FROM public.foods) AS foods;
