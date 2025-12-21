


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_profile_for_users"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_profile_for_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert a minimal profile record for the new user. If a profile already exists, do nothing.
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_profile_internal"("p_id" "uuid", "p_email" character varying, "p_full_name" "text", "p_created_at" timestamp with time zone) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at)
  VALUES (p_id, p_email, p_full_name, p_created_at)
  ON CONFLICT (id) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."insert_profile_internal"("p_id" "uuid", "p_email" character varying, "p_full_name" "text", "p_created_at" timestamp with time zone) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "text" DEFAULT ''::"text",
    "phone" "text",
    "city" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "company" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."company" IS 'Nom de société ou nom vendeur';



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow insert for authenticated users" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow users to read their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Allow users to update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."create_profile_for_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile_for_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile_for_users"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_auth_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."insert_profile_internal"("p_id" "uuid", "p_email" character varying, "p_full_name" "text", "p_created_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_profile_internal"("p_id" "uuid", "p_email" character varying, "p_full_name" "text", "p_created_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_profile_internal"("p_id" "uuid", "p_email" character varying, "p_full_name" "text", "p_created_at" timestamp with time zone) TO "service_role";


















GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































