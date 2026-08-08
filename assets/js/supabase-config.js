/* Supabase project connection. The anon/publishable key is safe to expose
   in frontend code — access is enforced by Row Level Security, not by
   keeping this key secret. */
(function (global) {
  'use strict';

  var SUPABASE_URL = 'https://bdzhxlwqltnozrwaqyev.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_YPpVCg3Kw0LwUP3dBnThag_0jc58DIW';

  global.MW = global.MW || {};
  global.MW.supabase = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})(window);
