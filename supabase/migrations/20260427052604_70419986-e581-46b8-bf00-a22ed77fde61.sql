-- Create demo admin user
DO $$
DECLARE
  admin_id uuid;
  student_id uuid;
BEGIN
  -- ===== ADMIN =====
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@aut.test';
  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id, 'authenticated', 'authenticated',
      'admin@aut.test',
      crypt('admin123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name','مسؤول لجنة المعادلات','saudi_university','جامعة العقبة للتكنولوجيا'),
      '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), admin_id,
            jsonb_build_object('sub', admin_id::text, 'email', 'admin@aut.test', 'email_verified', true),
            'email', admin_id::text, now(), now(), now());
  ELSE
    UPDATE auth.users
       SET encrypted_password = crypt('admin123', gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now())
     WHERE id = admin_id;
  END IF;

  -- Ensure profile exists (in case trigger didn't fire / older account)
  INSERT INTO public.profiles (id, full_name, saudi_university)
  VALUES (admin_id, 'مسؤول لجنة المعادلات', 'جامعة العقبة للتكنولوجيا')
  ON CONFLICT (id) DO NOTHING;

  -- Grant admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- ===== STUDENT =====
  SELECT id INTO student_id FROM auth.users WHERE email = 'student@aut.test';
  IF student_id IS NULL THEN
    student_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      student_id, 'authenticated', 'authenticated',
      'student@aut.test',
      crypt('student123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name','طالب تجريبي','saudi_university','جامعة الملك سعود'),
      '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), student_id,
            jsonb_build_object('sub', student_id::text, 'email', 'student@aut.test', 'email_verified', true),
            'email', student_id::text, now(), now(), now());
  ELSE
    UPDATE auth.users
       SET encrypted_password = crypt('student123', gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now())
     WHERE id = student_id;
  END IF;

  INSERT INTO public.profiles (id, full_name, saudi_university)
  VALUES (student_id, 'طالب تجريبي', 'جامعة الملك سعود')
  ON CONFLICT (id) DO NOTHING;
END $$;