-- Live abandoned checkouts: one open lead per phone (external_id = live:<digits>)
drop index if exists crm_leads_live_phone_uidx;

create unique index if not exists crm_leads_live_external_uidx
  on public.crm_leads (external_id)
  where source = 'abandoned' and external_id like 'live:%';
