const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase.from("teams").select("count");
  if (error) {
    console.error("ERROR: DB check failed", error.message);
    process.exit(1);
  }
  console.log("DB connection successful");
}
check();
