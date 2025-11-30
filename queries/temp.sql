ALTER TABLE public.consultant_module
DROP CONSTRAINT consultant_module_consultant_id_fkey;


ALTER TABLE public.consultant_module
ADD CONSTRAINT consultant_module_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id)
ON UPDATE CASCADE
ON DELETE CASCADE;


