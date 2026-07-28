/* Material AI — i18n engine (Vietnamese / English) */
(function () {
  var STORAGE_KEY = 'materialai_lang';

  var VI = {};
  var EN = {};
  window.I18N_VI = VI;
  window.I18N_EN = EN;

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) || 'vi';
  }

  function dict() {
    return getLang() === 'en' ? EN : VI;
  }

  function t(key) {
    var d = dict();
    if (Object.prototype.hasOwnProperty.call(d, key)) return d[key];
    if (Object.prototype.hasOwnProperty.call(VI, key)) return VI[key];
    return key;
  }

  function applyTranslations(root) {
    var scope = root || document;
    var lang = getLang();
    document.documentElement.lang = lang;

    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      var val = t(el.getAttribute('data-i18n'));
      if (val != null) el.textContent = val;
    });
    scope.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var val = t(el.getAttribute('data-i18n-html'));
      if (val != null) el.innerHTML = val;
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var val = t(el.getAttribute('data-i18n-placeholder'));
      if (val != null) el.setAttribute('placeholder', val);
    });
    scope.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      var val = t(el.getAttribute('data-i18n-aria-label'));
      if (val != null) el.setAttribute('aria-label', val);
    });
    scope.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var val = t(el.getAttribute('data-i18n-title'));
      if (val != null) el.setAttribute('title', val);
    });

    var titleKey = document.documentElement.getAttribute('data-i18n-doc-title');
    if (titleKey) document.title = t(titleKey);
    var descEl = document.querySelector('meta[name="description"][data-i18n-content]');
    if (descEl) descEl.setAttribute('content', t(descEl.getAttribute('data-i18n-content')));

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: lang } }));

    if (scope === document) document.documentElement.style.visibility = '';
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang === 'en' ? 'en' : 'vi');
    applyTranslations();
  }

  window.I18N = {
    t: t,
    getLang: getLang,
    setLang: setLang,
    apply: applyTranslations
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLang(btn.dataset.lang);
      });
    });
    applyTranslations();
  });

  /* ===== Shared: navbar, footer, common buttons ===== */
  Object.assign(VI, {
    'nav.home': 'Trang chủ',
    'nav.about': 'Giới thiệu',
    'nav.materials': 'Vật liệu',
    'nav.sellers': 'Nhà bán hàng',
    'nav.faq': 'Hỏi đáp',
    'nav.contact': 'Liên hệ',
    'nav.login': 'Đăng nhập',
    'nav.dashboard': 'Trang quản lý',
    'nav.cta_start': 'Bắt đầu miễn phí',
    'nav.search_cta': 'Tìm kiếm ngay',
    'nav.sell_cta': 'Đăng bán vật liệu',
    'footer.tagline': 'Nền tảng tìm kiếm và kết nối vật liệu nội thất bằng AI.',
    'footer.nav_title': 'Điều hướng',
    'footer.contact_title': 'Liên hệ',
    'footer.hotline': 'Hotline',
    'footer.follow_title': 'Theo dõi',
    'footer.copyright': '© 2026 Material AI. All rights reserved.',
    'common.close': 'Đóng',
    'common.clear_search': 'Xóa tìm kiếm',
    'common.verified': 'Đã xác thực',
    'common.unverified': 'Chưa xác thực',
    'common.office_address': 'Tầng 5, Toà nhà ABC, Quận 1, TP. Hồ Chí Minh',
    'common.logout': 'Đăng xuất',
    'common.back': 'Quay lại',
    'common.send': 'Gửi',
    'common.edit': 'Sửa',
    'common.cancel': 'Hủy',
    'common.confirm': 'Xác nhận',
    'common.delete': 'Xóa',
    'common.website_label': 'Website',
    'common.confirm_delete_material': 'Xóa vật liệu này?',
    'status.pending': 'Chờ duyệt',
    'status.approved': 'Đã duyệt',
    'status.blocked': 'Bị khóa'
  });

  /* ===== index.html (home) ===== */
  Object.assign(VI, {
    'home.doc_title': 'Material AI – Tìm kiếm vật liệu nội thất bằng hình ảnh',
    'home.doc_desc': 'Material AI kết nối nhà bán vật liệu nội thất (ván ép, đá, gạch, sơn, gỗ, kính) với khách hàng, kiến trúc sư, kỹ sư. Upload ảnh, tìm vật liệu tương tự bằng AI trong vài giây.',
    'home.badge': 'Tìm kiếm vật liệu bằng AI',
    'home.tagline': 'Nhanh · Chính xác · Minh bạch',
    'home.h1': 'Tìm đúng vật liệu nội thất chỉ với <span class="text-warm">một tấm ảnh</span>',
    'home.hero_desc': 'Upload ảnh vật liệu bạn cần — Material AI đối chiếu với hàng ngàn mẫu ván ép, đá, gạch, sơn, gỗ tự nhiên, kính từ các nhà bán hàng và trả về những lựa chọn tương tự nhất kèm giá.',
    'home.cta_upload': 'Upload ảnh tìm kiếm',
    'home.cta_for_sellers': 'Dành cho nhà bán hàng',
    'home.cta_browse': 'Khám phá kho vật liệu',
    'home.cta_seller_register': 'Đăng ký nhà bán hàng',
    'home.stat_sellers': 'nhà bán hàng',
    'home.stat_materials': 'mẫu vật liệu',
    'home.stat_free': 'miễn phí cho người tìm',
    'home.final_cta_h2': 'Sẵn sàng tìm vật liệu cho dự án của bạn?',
    'home.final_cta_sub': 'Chụp hoặc tải một tấm ảnh — nhận ngay danh sách vật liệu tương tự kèm giá từ hàng trăm nhà bán hàng.',
    'home.dropzone_title': 'Kéo & thả ảnh vật liệu vào đây',
    'home.dropzone_sub': 'hoặc bấm để chọn ảnh từ thiết bị',
    'home.dropzone_selected': 'Đang chuyển đến trang tìm kiếm...',
    'home.help_bubble': 'Chúng tôi có thể giúp gì cho bạn?',
    'home.help_widget_label': 'Trợ giúp',
    'home.back_to_top_label': 'Lên đầu trang',
    'home.features_h2': 'Nền tảng cho cả người bán và người tìm vật liệu',
    'home.features_sub': 'Ba trụ cột chính giúp Material AI kết nối toàn bộ chuỗi cung ứng vật liệu nội thất.',
    'home.feature1_title': 'Nhà bán hàng đăng vật liệu',
    'home.feature1_desc': 'Upload mẫu vật liệu, thông số kỹ thuật (kích thước, độ dày, chất liệu) và bảng giá minh bạch chỉ trong vài phút.',
    'home.feature2_title': 'Tìm kiếm bằng hình ảnh',
    'home.feature2_desc': 'Khách hàng, KTS, kỹ sư upload ảnh vật liệu cần tìm — AI phân tích vân, màu, chất liệu để gợi ý sản phẩm tương tự.',
    'home.feature3_title': 'So sánh & kết nối trực tiếp',
    'home.feature3_desc': 'So sánh giá, thông số giữa nhiều nhà cung cấp và liên hệ trực tiếp — không qua trung gian.',
    'home.testi_h2': 'Được tin dùng bởi ngành vật liệu nội thất',
    'home.testi_sub': 'Cảm nhận từ nhà bán hàng, kiến trúc sư và khách hàng đã sử dụng Material AI.',
    'home.testi1_quote': '"Chỉ cần chụp ảnh mẫu đá của khách, Material AI tìm ra ngay sản phẩm tương tự trong kho của tôi. Tiết kiệm rất nhiều thời gian tư vấn."',
    'home.testi1_role': 'Nhà bán đá tự nhiên',
    'home.testi2_quote': '"Là kỹ sư giám sát, tôi hay cần tìm gấp vật liệu thay thế đúng thông số. Công cụ tìm kiếm bằng ảnh giúp rút ngắn thời gian tra cứu đáng kể."',
    'home.testi2_role': 'Kỹ sư giám sát công trình',
    'home.testi3_quote': '"Danh mục vật liệu đầy đủ thông số và giá rõ ràng, tôi dễ dàng so sánh và chọn ván công nghiệp phù hợp cho dự án nhà ở."',
    'home.testi3_role': 'Kiến trúc sư nội thất',
    'home.faq_h2': 'Câu hỏi thường gặp',
    'home.faq_sub': 'Những thắc mắc phổ biến về Material AI.',
    'home.faq1_q': 'Material AI tìm kiếm vật liệu tương tự bằng cách nào?',
    'home.faq1_a': 'Hệ thống AI phân tích màu sắc, vân bề mặt và chất liệu trong ảnh bạn upload, sau đó đối chiếu với dữ liệu vật liệu do nhà bán hàng cung cấp để trả về các kết quả tương đồng nhất.',
    'home.faq2_q': 'Nhà bán hàng đăng vật liệu lên nền tảng như thế nào?',
    'home.faq2_a': 'Nhà bán hàng tạo tài khoản, upload ảnh sản phẩm, nhập thông số kỹ thuật (kích thước, độ dày, xuất xứ...) và giá bán. Sản phẩm sẽ hiển thị trong danh mục tương ứng ở trang Vật liệu.',
    'home.faq3_q': 'Tôi có thể tìm kiếm những loại vật liệu nào?',
    'home.faq3_a': 'Ván công nghiệp, sơn, gạch, đá tự nhiên, gỗ tự nhiên, kính và nhiều nhóm vật liệu nội thất khác, được cập nhật liên tục bởi các nhà bán hàng trên nền tảng.',
    'home.faq4_q': 'Sử dụng Material AI có mất phí không?',
    'home.faq4_a': 'Tìm kiếm và tra cứu vật liệu hoàn toàn miễn phí cho khách hàng, KTS và kỹ sư. Nhà bán hàng có thể tham khảo các gói đăng tin phù hợp với quy mô kinh doanh.',
    'home.faq_more_link': 'Xem tất cả câu hỏi thường gặp →'
  });

  /* ===== about.html ===== */
  Object.assign(VI, {
    'about.doc_title': 'Về Material AI – Sứ mệnh kết nối ngành vật liệu nội thất bằng AI',
    'about.doc_desc': 'Tìm hiểu sứ mệnh của Material AI, nhận xét từ khách hàng, nhà bán hàng, kỹ sư và thông tin liên hệ với đội ngũ.',
    'about.badge': 'Sứ mệnh của chúng tôi',
    'about.tagline': 'một nền tảng, muôn vật liệu',
    'about.h1': 'Số hóa toàn bộ dữ liệu vật liệu nội thất Việt Nam',
    'about.hero_desc': 'Material AI ra đời để rút ngắn khoảng cách giữa hàng nghìn nhà bán vật liệu và những người thực sự cần chúng — khách hàng, nhà thiết kế, kỹ sư — thông qua công nghệ tìm kiếm bằng hình ảnh, giúp việc chọn đúng vật liệu trở nên nhanh chóng, minh bạch và chính xác.',
    'about.stat1_label': 'Nhà bán hàng',
    'about.stat2_label': 'Mẫu vật liệu',
    'about.stat3_label': 'Độ chính xác tìm kiếm',
    'about.stat4_label': 'Tỉnh thành phủ sóng',
    'about.testi_h2': 'Tiếng nói từ cộng đồng Material AI',
    'about.testi_sub': 'Nhận xét từ khách hàng, nhà bán hàng và kỹ sư đang sử dụng nền tảng.',
    'about.tab_customer': 'Khách hàng',
    'about.tab_seller': 'Nhà bán hàng',
    'about.tab_engineer': 'Kỹ sư / KTS',
    'about.c1_quote': '"Tôi chỉ cần chụp ảnh sàn gỗ nhà mẫu là tìm được loại tương tự với giá tốt hơn."',
    'about.c1_name': 'Chị Hồng Anh — Khách hàng cá nhân',
    'about.c2_quote': '"Giao diện dễ dùng, thông tin giá rõ ràng, không cần gọi điện hỏi nhiều nơi."',
    'about.c2_name': 'Anh Quốc Bảo — Chủ nhà',
    'about.c3_quote': '"Tìm được đúng mẫu gạch ốp đã thích từ một tấm ảnh trên mạng."',
    'about.c3_name': 'Chị Thu Trang — Khách hàng',
    'about.s1_quote': '"Từ khi đăng sản phẩm lên Material AI, lượng khách liên hệ tăng rõ rệt."',
    'about.s1_name': 'Anh Minh Khôi — Nhà bán đá tự nhiên',
    'about.s2_quote': '"Upload thông số và giá rất nhanh, không mất thời gian như trước."',
    'about.s2_name': 'Chị Bích Ngọc — Đại lý sơn',
    'about.s3_quote': '"Khách tìm đến đúng sản phẩm mình có, tỉ lệ chốt đơn cao hơn hẳn."',
    'about.s3_name': 'Anh Văn Hải — Xưởng ván công nghiệp',
    'about.e1_quote': '"Cần vật liệu thay thế gấp khi thi công, tra cứu bằng ảnh tiết kiệm rất nhiều thời gian."',
    'about.e1_name': 'Kỹ sư Thanh Tùng — Giám sát công trình',
    'about.e2_quote': '"Thông số kỹ thuật đầy đủ giúp tôi lên hồ sơ vật liệu cho dự án nhanh hơn."',
    'about.e2_name': 'Chị Ngọc Lan — Kiến trúc sư nội thất',
    'about.e3_quote': '"So sánh giá giữa nhiều nhà cung cấp trên cùng một nền tảng rất tiện."',
    'about.e3_name': 'Kỹ sư Đức Anh — Kỹ sư xây dựng',
    'about.contact_h2': 'Liên hệ với chúng tôi',
    'about.contact_desc': 'Có câu hỏi về hợp tác, đăng bán vật liệu hoặc phản hồi sản phẩm? Gửi thông tin cho đội ngũ Material AI, chúng tôi phản hồi trong vòng 24 giờ làm việc.',
    'about.contact_cta': 'Gửi liên hệ ngay'
  });

  /* ===== shared category/list labels ===== */
  Object.assign(VI, {
    'common.all': 'Tất cả',
    'common.cat_van': 'Ván công nghiệp',
    'common.cat_son': 'Sơn',
    'common.cat_gach': 'Gạch',
    'common.cat_da': 'Đá',
    'common.cat_kinh': 'Kính',
    'common.cat_go': 'Gỗ tự nhiên'
  });

  /* ===== faq.html ===== */
  Object.assign(VI, {
    'faq.doc_title': 'Hỏi đáp – Câu hỏi thường gặp về Material AI',
    'faq.doc_desc': 'Giải đáp thắc mắc về tìm kiếm vật liệu bằng AI, đăng bán sản phẩm, thanh toán và bảo mật trên Material AI. Tìm nhanh câu trả lời hoặc liên hệ đội ngũ hỗ trợ.',
    'faq.badge': 'Hỏi đáp',
    'faq.tagline': 'giải đáp mọi thắc mắc',
    'faq.h1': 'Câu hỏi thường gặp',
    'faq.hero_desc': 'Tìm nhanh câu trả lời về tìm kiếm vật liệu bằng AI, đăng bán sản phẩm, thanh toán và bảo mật.',
    'faq.search_placeholder': 'Tìm câu hỏi... (VD: đăng bán, thanh toán, tìm kiếm)',
    'faq.cat_search': 'Tìm kiếm bằng AI',
    'faq.cat_sellers': 'Nhà bán hàng',
    'faq.cat_account': 'Tài khoản & Thanh toán',
    'faq.cat_security': 'Bảo mật & Dữ liệu',
    'faq.q1': 'Material AI tìm kiếm vật liệu tương tự bằng cách nào?',
    'faq.a1': 'Hệ thống AI phân tích màu sắc, vân bề mặt và chất liệu trong ảnh bạn upload, sau đó đối chiếu với dữ liệu vật liệu do nhà bán hàng cung cấp để trả về các kết quả tương đồng nhất.',
    'faq.q2': 'Tôi có thể tìm kiếm những loại vật liệu nào?',
    'faq.a2': 'Ván công nghiệp, sơn, gạch, đá tự nhiên, gỗ tự nhiên, kính và nhiều nhóm vật liệu nội thất khác, được cập nhật liên tục bởi các nhà bán hàng trên nền tảng.',
    'faq.q3': 'Ảnh upload cần đáp ứng yêu cầu gì để AI nhận diện chính xác?',
    'faq.a3': 'Nên chụp ảnh rõ nét, đủ sáng, chụp cận cảnh bề mặt vật liệu và tránh bị che khuất hoặc lóa sáng. Định dạng JPG/PNG, dung lượng tối đa 10MB cho mỗi lần tìm kiếm.',
    'faq.q4': 'Nhà bán hàng đăng vật liệu lên nền tảng như thế nào?',
    'faq.a4': 'Nhà bán hàng tạo tài khoản, upload ảnh sản phẩm, nhập thông số kỹ thuật (kích thước, độ dày, xuất xứ...) và giá bán. Sản phẩm sẽ hiển thị trong danh mục tương ứng ở trang Vật liệu.',
    'faq.q5': 'Đăng bao nhiêu sản phẩm thì mất phí?',
    'faq.a5': '5 sản phẩm đầu tiên hoàn toàn miễn phí. Từ sản phẩm thứ 6, nhà bán hàng có thể chọn các gói đăng tin trả phí theo quy mô kinh doanh, xem chi tiết tại trang Liên hệ.',
    'faq.q6': 'Làm sao để hồ sơ nhà bán hàng được gắn nhãn "Đã xác thực"?',
    'faq.a6': 'Gửi giấy phép kinh doanh hoặc thông tin định danh doanh nghiệp qua trang Liên hệ. Đội ngũ Material AI xác minh trong vòng 2–3 ngày làm việc trước khi gắn nhãn xác thực.',
    'faq.q7': 'Sử dụng Material AI có mất phí không?',
    'faq.a7': 'Tìm kiếm và tra cứu vật liệu hoàn toàn miễn phí cho khách hàng, KTS và kỹ sư. Nhà bán hàng có thể tham khảo các gói đăng tin phù hợp với quy mô kinh doanh.',
    'faq.q8': 'Material AI có xử lý thanh toán giữa người mua và người bán không?',
    'faq.a8': 'Không. Material AI là nền tảng kết nối và tìm kiếm — việc thương lượng giá, đặt hàng và thanh toán diễn ra trực tiếp giữa khách hàng và nhà bán hàng, không qua trung gian.',
    'faq.q9': 'Tôi có thể đổi hoặc xoá tài khoản như thế nào?',
    'faq.a9': 'Gửi yêu cầu qua trang Liên hệ kèm email đăng ký. Đội ngũ hỗ trợ sẽ xử lý thay đổi thông tin hoặc xoá tài khoản trong vòng 48 giờ.',
    'faq.q10': 'Ảnh tôi upload để tìm kiếm có được lưu trữ hoặc chia sẻ không?',
    'faq.a10': 'Ảnh chỉ được dùng để đối chiếu tìm kiếm trong phiên sử dụng và không chia sẻ cho bên thứ ba. Bạn có thể yêu cầu xoá toàn bộ lịch sử tìm kiếm qua trang Liên hệ.',
    'faq.q11': 'Thông tin liên hệ của tôi có bị công khai khi liên hệ nhà bán hàng không?',
    'faq.a11': 'Thông tin chỉ được gửi trực tiếp đến nhà bán hàng bạn chọn liên hệ, không hiển thị công khai trên hồ sơ hay hồ sơ tìm kiếm của người dùng khác.',
    'faq.empty': 'Không tìm thấy câu hỏi phù hợp. Hãy thử từ khoá khác hoặc liên hệ trực tiếp với chúng tôi.',
    'faq.cta_h2': 'Không tìm thấy câu trả lời bạn cần?',
    'faq.cta_desc': 'Gửi câu hỏi trực tiếp cho đội ngũ Material AI, chúng tôi phản hồi trong vòng 24 giờ làm việc.',
    'faq.cta_button': 'Liên hệ với chúng tôi'
  });

  /* ===== contact.html ===== */
  Object.assign(VI, {
    'contact.doc_title': 'Liên hệ Material AI – Hỗ trợ khách hàng & nhà bán hàng',
    'contact.doc_desc': 'Liên hệ với đội ngũ Material AI để được hỗ trợ tìm kiếm vật liệu, đăng bán sản phẩm hoặc hợp tác kinh doanh. Email, hotline, địa chỉ văn phòng và biểu mẫu gửi yêu cầu.',
    'contact.h1': 'Chúng tôi luôn sẵn sàng hỗ trợ bạn',
    'contact.tagline': 'Luôn lắng nghe · Luôn phản hồi',
    'contact.hero_desc': 'Có câu hỏi về tìm kiếm vật liệu bằng AI, đăng bán sản phẩm hay hợp tác kinh doanh? Gửi yêu cầu cho đội ngũ Material AI, chúng tôi phản hồi trong vòng 24 giờ làm việc.',
    'contact.email_title': 'Email hỗ trợ',
    'contact.hotline_title': 'Hotline',
    'contact.zalo_title': 'Zalo',
    'contact.hotline_hours': 'Thứ 2 – Thứ 7, 8:00 – 18:00',
    'contact.office_title': 'Văn phòng',
    'contact.form_h2': 'Gửi yêu cầu cho chúng tôi',
    'contact.form_desc': 'Điền thông tin bên cạnh, đội ngũ Material AI sẽ liên hệ lại theo đúng chủ đề bạn quan tâm — từ hỗ trợ tìm kiếm vật liệu đến hợp tác đăng bán sản phẩm.',
    'contact.faq_hint': 'Bạn có thắc mắc thường gặp? Xem trang <a href="faq.html" class="text-secondary font-semibold hover:underline">Hỏi đáp</a> trước khi gửi liên hệ.',
    'contact.field_name': 'Họ và tên',
    'contact.field_name_placeholder': 'Nguyễn Văn A',
    'contact.field_phone': 'Số điện thoại',
    'contact.field_email': 'Email',
    'contact.field_email_placeholder': 'ban@email.com',
    'contact.field_subject': 'Chủ đề',
    'contact.subject1': 'Hỗ trợ tìm kiếm vật liệu',
    'contact.subject2': 'Đăng bán / hợp tác nhà bán hàng',
    'contact.subject3': 'Báo lỗi hệ thống',
    'contact.subject4': 'Khác',
    'contact.field_message': 'Lời nhắn',
    'contact.field_message_placeholder': 'Nội dung liên hệ...',
    'contact.submit_button': 'Gửi liên hệ',
    'contact.form_success': 'Cảm ơn bạn! Yêu cầu đã được ghi nhận, chúng tôi sẽ phản hồi sớm nhất.'
  });

  /* ===== materials.html ===== */
  Object.assign(VI, {
    'materials.doc_title': 'Danh mục vật liệu nội thất – Ván, Đá, Gạch, Sơn, Kính | Material AI',
    'materials.doc_desc': 'Khám phá kho vật liệu nội thất từ hàng ngàn nhà bán hàng: ván công nghiệp, sơn, gạch, đá, kính, gỗ tự nhiên. Xem thông số kỹ thuật và giá, hoặc upload ảnh để tìm vật liệu tương tự.',
    'materials.h1': 'Kho vật liệu nội thất',
    'materials.tagline': 'Đúng chất liệu · Đúng lựa chọn',
    'materials.subtitle': 'Duyệt theo danh mục hoặc upload ảnh để AI tìm vật liệu tương tự nhất.',
    'materials.upload_label': 'Upload ảnh tìm kiếm',
    'materials.pending_title': 'Đang tìm vật liệu tương tự với ảnh của bạn',
    'materials.search_placeholder': 'Tìm theo tên vật liệu, mã sản phẩm...',
    'materials.search_button': 'Tìm kiếm',
    'materials.card1_title': 'Ván MDF phủ Melamine vân sồi',
    'materials.card1_spec': 'Dày 18mm · Kích thước 1220x2440mm',
    'materials.card1_price': '450.000đ/tấm',
    'materials.card2_title': 'Sơn nội thất tông xanh rêu nhạt',
    'materials.card2_spec': '18L · Phủ 40-45m²/lít',
    'materials.card2_price': '1.250.000đ/thùng',
    'materials.card3_title': 'Gạch ốp lát vân đá marble',
    'materials.card3_spec': '600x600mm · Bề mặt bóng gương',
    'materials.card3_price': '185.000đ/m²',
    'materials.card4_title': 'Đá granite tự nhiên đen Phú Yên',
    'materials.card4_spec': 'Dày 20mm · Bề mặt mài bóng',
    'materials.card4_price': '890.000đ/m²',
    'materials.card5_title': 'Kính cường lực trong suốt',
    'materials.card5_spec': 'Dày 10mm · An toàn, chịu lực cao',
    'materials.card5_price': '620.000đ/m²',
    'materials.card6_title': 'Gỗ sồi tự nhiên nguyên tấm',
    'materials.card6_spec': 'Dày 25mm · Đã sấy tẩm chống mối',
    'materials.card6_price': '3.200.000đ/m³',
    'materials.card7_title': 'Ván ép Plywood phủ Phenolic',
    'materials.card7_spec': 'Dày 12mm · Chống nước',
    'materials.card7_price': '380.000đ/tấm',
    'materials.card8_title': 'Đá marble trắng vân mây',
    'materials.card8_spec': 'Dày 18mm · Nhập khẩu',
    'materials.card8_price': '1.450.000đ/m²',
    'materials.card9_title': 'Ván MFC phủ Melamine vân sồi Kilkenny',
    'materials.card9_spec': 'Dày 18mm · Kích thước 1220x2440mm',
    'materials.card9_price': '340.000đ/tấm',
    'materials.card10_title': 'Ván MDF phủ Melamine vân sồi Santana',
    'materials.card10_spec': 'Dày 17mm · Kích thước 1220x2440mm',
    'materials.card10_price': '420.000đ/tấm',
    'materials.card11_title': 'Ván MFC phủ Melamine bề mặt loft công nghiệp',
    'materials.card11_spec': 'Dày 18mm · Chống trầy xước',
    'materials.card11_price': '395.000đ/tấm',
    'materials.card12_title': 'Sơn nội thất tông xanh dương khói',
    'materials.card12_spec': '18L · Phủ 40-45m²/lít',
    'materials.card12_price': '1.290.000đ/thùng',
    'materials.card13_title': 'Sơn nội thất tông đất nung ấm',
    'materials.card13_spec': '18L · Phủ 40-45m²/lít',
    'materials.card13_price': '1.180.000đ/thùng',
    'materials.card14_title': 'Sơn nội thất tông kem trung tính',
    'materials.card14_spec': '5L · Phủ 40-45m²/lít',
    'materials.card14_price': '450.000đ/thùng',
    'materials.card15_title': 'Gạch ốp lát bê tông xám',
    'materials.card15_spec': '600x600mm · Bề mặt mờ',
    'materials.card15_price': '165.000đ/m²',
    'materials.card16_title': 'Gạch vân đá trắng ngà cao cấp',
    'materials.card16_spec': '800x800mm · Bề mặt bóng gương',
    'materials.card16_price': '245.000đ/m²',
    'materials.card17_title': 'Gạch vân đá hồng phấn nhạt',
    'materials.card17_spec': '600x1200mm · Bề mặt mờ',
    'materials.card17_price': '210.000đ/m²',
    'materials.card18_title': 'Đá tự nhiên đen nhám cao cấp',
    'materials.card18_spec': 'Dày 20mm · Bề mặt nhám chống trơn',
    'materials.card18_price': '950.000đ/m²',
    'materials.card19_title': 'Đá marble xám vân mây đậm',
    'materials.card19_spec': 'Dày 20mm · Nhập khẩu',
    'materials.card19_price': '1.680.000đ/m²',
    'materials.card20_title': 'Đá marble xám nhạt vân tự nhiên',
    'materials.card20_spec': 'Dày 18mm · Bề mặt mài bóng',
    'materials.card20_price': '1.120.000đ/m²',
    'materials.find_similar': 'Tìm tương tự',
    'materials.empty': 'Không tìm thấy vật liệu phù hợp. Hãy thử từ khoá hoặc danh mục khác.',
    'materials.load_more': 'Xem thêm vật liệu',
    'materials.modal_contact': 'Liên hệ ngay',
    'materials.modal_view_products': 'Xem sản phẩm',
    'materials.products_selling': 'sản phẩm đang bán',
    'materials.add_to_cart': 'Thêm vào giỏ hàng',
    'materials.added_to_cart': '✓ Đã thêm'
  });

  /* ===== cart widget (materials.html, sellers.html) ===== */
  Object.assign(VI, {
    'cart.title': 'Giỏ hàng của bạn',
    'cart.empty': 'Giỏ hàng đang trống. Bấm "Thêm vào giỏ hàng" trên vật liệu bạn quan tâm.',
    'cart.subtotal': 'Tạm tính',
    'cart.grand_total': 'Tổng cộng',
    'cart.checkout': 'Đặt hàng',
    'cart.note': 'Bấm "Đặt hàng" cho từng nhà bán hàng để hoàn tất đơn — thanh toán khi nhận hàng hoặc chuyển khoản trực tiếp.',
    'cart.clear': 'Xóa giỏ hàng',
    'cart.clear_confirm': 'Xóa toàn bộ giỏ hàng?'
  });

  /* ===== checkout modal (materials.html, sellers.html, ...) ===== */
  Object.assign(VI, {
    'checkout.total': 'Tổng thanh toán',
    'checkout.discount': 'Giảm giá',
    'checkout.voucher_label': 'Mã giảm giá (nếu có)',
    'checkout.voucher_apply': 'Áp dụng',
    'checkout.voucher_invalid': 'Mã giảm giá không hợp lệ hoặc đã hết hạn.',
    'checkout.voucher_applied': 'Đã áp dụng mã giảm giá.',
    'checkout.name_label': 'Họ tên người nhận',
    'checkout.phone_label': 'Số điện thoại',
    'checkout.address_label': 'Địa chỉ giao hàng',
    'checkout.payment_label': 'Phương thức thanh toán',
    'checkout.payment_cod': 'Thanh toán khi nhận hàng (COD)',
    'checkout.payment_bank': 'Chuyển khoản ngân hàng',
    'checkout.submit': 'Xác nhận đặt hàng',
    'checkout.missing_fields': 'Vui lòng điền đầy đủ thông tin giao hàng.',
    'checkout.success_title': 'Đặt hàng thành công!',
    'checkout.success_sub': 'Nhà bán hàng sẽ liên hệ xác nhận với bạn.'
  });

  /* ===== order status (customer order history + seller order management) ===== */
  Object.assign(VI, {
    'order_status.pending': 'Chờ xác nhận',
    'order_status.confirmed': 'Đã xác nhận',
    'order_status.shipping': 'Đang giao',
    'order_status.completed': 'Hoàn tất',
    'order_status.cancelled': 'Đã huỷ'
  });

  /* ===== customer nav dropdown (materials.html, sellers.html, index.html, faq.html, contact.html) ===== */
  Object.assign(VI, {
    'nav_menu.order_history': 'Lịch sử đặt hàng',
    'orders.loading': 'Đang tải...',
    'orders.empty': 'Bạn chưa đặt đơn hàng nào.'
  });

  /* ===== sellers.html ===== */
  Object.assign(VI, {
    'sellers.doc_title': 'Danh sách nhà bán hàng – Vật liệu nội thất | Material AI',
    'sellers.doc_desc': 'Khám phá danh sách nhà bán vật liệu nội thất trên Material AI: ván công nghiệp, sơn, gạch, đá, kính, gỗ tự nhiên. Xem hồ sơ, đánh giá và thông tin liên hệ đầy đủ của từng nhà bán hàng.',
    'sellers.h1': 'Danh sách nhà bán hàng',
    'sellers.tagline': 'Những đối tác đáng tin cậy',
    'sellers.subtitle': 'Khám phá hồ sơ các nhà bán vật liệu nội thất trên Material AI — bấm vào một nhà bán hàng để xem đầy đủ thông tin.',
    'sellers.search_placeholder': 'Tìm theo tên nhà bán hàng, khu vực...',
    'sellers.modal_address': 'Địa chỉ',
    'sellers.modal_phone': 'Điện thoại',
    'sellers.modal_email': 'Email',
    'sellers.modal_website': 'Website',
    'sellers.modal_materials_heading': 'Vật liệu tiêu biểu',
    'sellers.modal_view_all': 'Xem tất cả vật liệu',
    'sellers.modal_contact_seller': 'Liên hệ nhà bán hàng',
    'sellers.materials_count_short': 'vật liệu',
    'sellers.materials_selling': 'vật liệu đang bán',
    'sellers.established': 'Thành lập',
    'sellers.reviews_label': 'đánh giá',
    'sellers.years_active': 'năm hoạt động'
  });

  /* ===== login.html ===== */
  Object.assign(VI, {
    'login.doc_title': 'Đăng nhập – Material AI',
    'login.h1': 'Đăng nhập',
    'login.tagline': 'Chào mừng bạn quay lại',
    'login.email_label': 'Email',
    'login.password_label': 'Mật khẩu',
    'login.show_password': 'Hiện mật khẩu',
    'login.hide_password': 'Ẩn mật khẩu',
    'login.submit': 'Đăng nhập',
    'login.register_hint': 'Chưa có tài khoản? <a href="register-choice.html" class="text-secondary font-semibold hover:underline">Đăng ký ngay</a>',
    'login.registered_notice': 'Đăng ký thành công! Vui lòng đăng nhập.',
    'login.reset_notice': 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.',
    'login.forgot_password': 'Quên mật khẩu?',
    'login.demo_title': 'Tài khoản demo để dùng thử:',
    'login.demo_seller_label': 'Nhà bán hàng'
  });

  /* ===== forgot-password.html ===== */
  Object.assign(VI, {
    'forgot.doc_title': 'Quên mật khẩu – Material AI',
    'forgot.h1': 'Quên mật khẩu',
    'forgot.tagline': 'Đặt lại mật khẩu của bạn',
    'forgot.email_hint': 'Nhập email tài khoản của bạn để tiếp tục.',
    'forgot.continue': 'Tiếp tục',
    'forgot.back_to_login': 'Quay lại đăng nhập',
    'forgot.reset_hint': 'Đặt mật khẩu mới cho tài khoản <span id="resetEmailLabel" class="font-semibold text-ink"></span>.',
    'forgot.new_password_label': 'Mật khẩu mới',
    'forgot.confirm_password_label': 'Xác nhận mật khẩu mới',
    'forgot.submit': 'Đặt lại mật khẩu',
    'forgot.mismatch_error': 'Mật khẩu xác nhận không khớp.'
  });

  /* ===== register-choice.html ===== */
  Object.assign(VI, {
    'register_choice.doc_title': 'Đăng ký tài khoản – Material AI',
    'register_choice.badge': 'Tạo tài khoản mới',
    'register_choice.h1': 'Bạn muốn đăng ký với vai trò nào?',
    'register_choice.tagline': 'Chọn loại tài khoản phù hợp',
    'register_choice.customer_title': 'Khách hàng',
    'register_choice.customer_desc': 'Lưu giỏ hàng, gửi yêu cầu mua vật liệu tới nhà bán hàng.',
    'register_choice.customer_cta': 'Đăng ký khách hàng',
    'register_choice.seller_title': 'Nhà bán hàng',
    'register_choice.seller_desc': 'Đăng bán vật liệu, quản lý gian hàng và trò chuyện với khách hàng.',
    'register_choice.seller_cta': 'Đăng ký nhà bán hàng'
  });

  /* ===== register.html ===== */
  Object.assign(VI, {
    'register.doc_title': 'Đăng ký nhà bán hàng – Material AI',
    'register.badge': 'Dành cho nhà bán hàng',
    'register.h1': 'Đăng ký bán vật liệu',
    'register.tagline': 'bắt đầu tiếp cận khách hàng mới',
    'register.email_label': 'Email đăng nhập',
    'register.password_label': 'Mật khẩu',
    'register.password_placeholder': 'Tối thiểu 8 ký tự',
    'register.business_name_label': 'Tên nhà bán hàng',
    'register.business_name_placeholder': 'Xưởng Ván ABC',
    'register.category_label': 'Ngành hàng',
    'register.phone_label': 'Số điện thoại',
    'register.website_label': 'Website (không bắt buộc)',
    'register.website_placeholder': 'tenmien.vn',
    'register.address_label': 'Địa chỉ',
    'register.address_placeholder': 'Số nhà, đường, quận/huyện, tỉnh/thành',
    'register.description_label': 'Giới thiệu ngắn',
    'register.description_placeholder': 'Vài dòng về sản phẩm và thế mạnh của bạn...',
    'register.submit': 'Đăng ký',
    'register.login_hint': 'Đã có tài khoản? <a href="login.html" class="text-secondary font-semibold hover:underline">Đăng nhập</a>',
    'register.customer_hint': 'Bạn là khách hàng? <a href="customer-register.html" class="text-secondary font-semibold hover:underline">Đăng ký tại đây</a>',
    'register.approval_note': 'Sau khi đăng ký, tài khoản của bạn cần được admin duyệt trước khi đăng bán vật liệu.'
  });

  /* ===== customer-register.html ===== */
  Object.assign(VI, {
    'customer_register.doc_title': 'Đăng ký khách hàng – Material AI',
    'customer_register.badge': 'Dành cho khách hàng',
    'customer_register.h1': 'Tạo tài khoản khách hàng',
    'customer_register.tagline': 'Lưu giỏ hàng · Mua sắm mọi lúc',
    'customer_register.name_label': 'Họ và tên',
    'customer_register.login_hint': 'Đã có tài khoản? <a href="login.html" class="text-secondary font-semibold hover:underline">Đăng nhập</a>',
    'customer_register.seller_hint': 'Bạn là nhà bán hàng? <a href="register.html" class="text-secondary font-semibold hover:underline">Đăng ký tại đây</a>'
  });

  /* ===== admin-dashboard.html ===== */
  Object.assign(VI, {
    'admin.doc_title': 'Bảng điều khiển quản trị – Material AI',
    'admin.navbar_title': 'Bảng điều khiển quản trị',
    'admin.menu_overview': 'Tổng quan',
    'admin.menu_dashboard': 'Bảng điều khiển',
    'admin.menu_group_manage': 'Quản lý',
    'admin.menu_group_system': 'Hệ thống',
    'admin.menu_customers': 'Khách hàng',
    'admin.menu_contacts': 'Đơn liên hệ',
    'admin.menu_reviews': 'Đánh giá',
    'admin.menu_settings': 'Cài đặt',
    'admin.coming_soon': 'Chức năng đang được phát triển — sẽ ra mắt trong phiên bản tới.',
    'admin.shortcut_sellers': 'Duyệt nhà bán hàng chờ xử lý',
    'admin.shortcut_sellers_desc': 'Phê duyệt, chặn hoặc xóa tài khoản nhà bán hàng.',
    'admin.shortcut_materials': 'Kiểm duyệt vật liệu',
    'admin.shortcut_materials_desc': 'Xem và gỡ các vật liệu vi phạm trên nền tảng.',
    'admin.pending_sellers': 'Hồ sơ chờ duyệt',
    'admin.no_pending': 'Không có hồ sơ nào chờ duyệt.',
    'admin.chart_by_category': 'Vật liệu theo danh mục',
    'admin.top_sellers': 'Top nhà bán hàng',
    'admin.latest_materials': 'Vật liệu mới nhất',
    'admin.view_all': 'Xem tất cả →',
    'admin.stat_customers': 'Khách hàng',
    'admin.stat_orders': 'Lượt đặt mua',
    'admin.stat_conversations': 'Cuộc chat liên hệ',
    'admin.stat_messages': 'Tin nhắn trao đổi',
    'admin.sellers_th_address': 'Địa chỉ',
    'admin.th_stt': 'STT',
    'admin.no_data': 'Chưa có dữ liệu.',
    'admin.customers_th_name': 'Khách hàng',
    'admin.customers_th_email': 'Email',
    'admin.customers_th_status': 'Trạng thái',
    'admin.customers_th_orders': 'Đơn đã đặt',
    'admin.customers_th_spend': 'Tổng chi tiêu',
    'admin.customers_th_created': 'Ngày tạo',
    'admin.customers_stat_total': 'Tổng khách hàng',
    'admin.customers_stat_new_month': 'Khách mới tháng này',
    'admin.customers_stat_orders': 'Tổng đơn hàng',
    'admin.customers_stat_revenue': 'Tổng doanh thu',
    'admin.contacts_th_customer': 'Khách hàng',
    'admin.contacts_th_seller': 'Nhà bán hàng',
    'admin.contacts_th_messages': 'Tin nhắn',
    'admin.contacts_th_last': 'Hoạt động cuối',
    'admin.materials_th_unit': 'Đơn vị tính',
    'admin.h1': 'Quản trị hệ thống',
    'admin.tagline': 'Toàn cảnh Material AI',
    'admin.stat_total_sellers': 'Tổng nhà bán hàng',
    'admin.stat_materials': 'Tổng vật liệu',
    'admin.sellers_stat_total': 'Tổng nhà bán hàng',
    'admin.sellers_stat_new_month': 'Nhà bán hàng mới tháng này',
    'admin.sellers_th_name': 'Nhà bán hàng',
    'admin.sellers_th_category': 'Ngành hàng',
    'admin.sellers_th_materials': 'Vật liệu',
    'admin.sellers_th_status': 'Trạng thái',
    'admin.th_action': 'Hành động',
    'admin.materials_th_name': 'Vật liệu',
    'admin.materials_th_seller': 'Nhà bán hàng',
    'admin.materials_th_category': 'Danh mục',
    'admin.materials_th_price': 'Giá',
    'admin.action_approve': 'Duyệt',
    'admin.action_block': 'Khóa',
    'admin.action_unblock': 'Mở khóa',
    'admin.confirm_delete_seller': 'Xóa nhà bán hàng này? Toàn bộ vật liệu của họ cũng sẽ bị xóa.'
  });

  /* ===== seller-dashboard.html ===== */
  Object.assign(VI, {
    'seller.orders_th_material': 'Vật liệu',
    'seller.orders_th_customer': 'Thông tin khách hàng',
    'seller.orders_th_time': 'Thời gian đặt',
    'seller.orders_th_price': 'Giá tiền',
    'seller.orders_th_qty': 'Số lượng',
    'seller.orders_th_discount': 'Giảm giá',
    'seller.orders_th_total': 'Thành tiền',
    'seller.orders_th_status': 'Trạng thái',
    'seller.menu_materials': 'Quản lý vật liệu',
    'seller.material_unit_label': 'Đơn vị tính',
    'seller.material_unit_placeholder': 'VD: tấm, m², thùng',
    'seller.material_image_label': 'Hình ảnh',
    'seller.material_image_hint': 'Chọn hoặc kéo thả ảnh',
    'seller.material_image_hint_sub': 'JPG, PNG tối đa 5MB',
    'seller.material_image_too_large': 'Ảnh quá lớn (tối đa 5MB).',
    'seller.material_desc_label': 'Mô tả',
    'seller.material_desc_placeholder': 'VD: Bề mặt chống trầy, phù hợp tủ bếp, vân gỗ tự nhiên...',
    'seller.update_material': 'Cập nhật vật liệu',
    'seller.material_updated': 'Đã cập nhật vật liệu thành công.',
    'seller.confirm_title': 'Xác nhận',
    'seller.confirm_add': 'Bạn có chắc muốn đăng vật liệu này?',
    'seller.confirm_update': 'Bạn có chắc muốn cập nhật vật liệu này?',
    'seller.material_deleted': 'Đã xóa vật liệu.',
    'seller.menu_group_store': 'Gian hàng',
    'seller.menu_group_account': 'Tài khoản',
    'seller.menu_messages': 'Tin nhắn',
    'seller.menu_profile': 'Hồ sơ',
    'seller.doc_title': 'Bảng điều khiển nhà bán hàng – Material AI',
    'seller.navbar_title': 'Bảng điều khiển nhà bán hàng',
    'seller.greeting': 'Xin chào,',
    'seller.tagline': 'Quản lý gian hàng của bạn',
    'seller.pending_notice': 'Tài khoản của bạn đang <strong>chờ admin duyệt</strong>. Bạn có thể cập nhật hồ sơ ngay bây giờ, nhưng cần được duyệt trước khi đăng vật liệu lên hệ thống.',
    'seller.blocked_notice': 'Tài khoản của bạn đã <strong>bị khóa</strong>. Vui lòng liên hệ quản trị viên nếu có thắc mắc.',
    'seller.messages_title': 'Tin nhắn khách hàng',
    'seller.chat_empty': 'Chưa có khách hàng nào nhắn tin.',
    'seller.chat_input_placeholder': 'Nhập tin nhắn...',
    'seller.profile_title': 'Hồ sơ nhà bán hàng',
    'seller.description_label': 'Giới thiệu',
    'seller.save_profile': 'Lưu hồ sơ',
    'seller.profile_saved': 'Đã lưu hồ sơ.',
    'seller.add_material_title': 'Đăng vật liệu mới',
    'seller.material_category_label': 'Danh mục',
    'seller.material_title_label': 'Tên vật liệu',
    'seller.material_title_placeholder': 'VD: Ván MDF phủ Melamine vân sồi',
    'seller.material_code_label': 'Mã vật liệu',
    'seller.material_code_placeholder': 'VD: VAN-MDF-01',
    'seller.material_spec_label': 'Thông số',
    'seller.material_spec_placeholder': 'VD: Dày 18mm · Kích thước 1220x2440mm',
    'seller.material_price_label': 'Giá',
    'seller.material_price_placeholder': 'VD: 450.000đ',
    'seller.submit_material': 'Đăng vật liệu',
    'seller.material_added': 'Đã đăng vật liệu.',
    'seller.materials_list_title': 'Vật liệu đang bán',
    'seller.materials_empty': 'Bạn chưa đăng vật liệu nào.',
    'seller.orders_title': 'Đơn hàng',
    'seller.orders_empty': 'Chưa có đơn hàng nào.',
    'seller.vouchers_title': 'Mã giảm giá',
    'seller.voucher_code_placeholder': 'VD: SALE10',
    'seller.voucher_type_percent': 'Giảm theo %',
    'seller.voucher_type_fixed': 'Giảm số tiền',
    'seller.voucher_value_placeholder': 'VD: 10',
    'seller.voucher_add': 'Thêm mã giảm giá',
    'seller.voucher_added': 'Đã thêm mã giảm giá.',
    'seller.voucher_active': 'Đang áp dụng',
    'seller.voucher_code_label': 'Mã giảm giá',
    'seller.voucher_type_label': 'Loại giảm giá',
    'seller.voucher_value_label': 'Giá trị',
    'seller.voucher_min_order_label': 'Đơn tối thiểu',
    'seller.voucher_min_order_placeholder': 'VD: 500000',
    'seller.voucher_max_discount_label': 'Giảm tối đa',
    'seller.voucher_max_discount_placeholder': 'VD: 100000',
    'seller.voucher_max_discount_hint': 'Chỉ áp dụng khi giảm theo %',
    'seller.voucher_usage_limit_label': 'Giới hạn lượt dùng',
    'seller.voucher_usage_limit_placeholder': 'VD: 50',
    'seller.voucher_expires_label': 'Hạn sử dụng',
    'seller.voucher_usage_th': 'Đã dùng',
    'seller.voucher_no_expiry': 'Không giới hạn',
    'seller.voucher_stat_total': 'Tổng số mã',
    'seller.voucher_stat_active': 'Đang hoạt động',
    'seller.voucher_stat_used': 'Tổng lượt đã dùng',
    'seller.voucher_status_active': 'Đang hoạt động',
    'seller.voucher_status_off': 'Tạm tắt',
    'seller.voucher_status_expired': 'Hết hạn',
    'seller.voucher_status_used_up': 'Hết lượt',
    'seller.voucher_deactivate': 'Tắt',
    'seller.voucher_activate': 'Bật',
    'seller.voucher_deactivated': 'Đã tắt mã giảm giá.',
    'seller.voucher_activated': 'Đã bật mã giảm giá.',
    'seller.voucher_deleted': 'Đã xóa mã giảm giá.',
    'seller.voucher_material_label': 'Áp dụng cho Mã vật liệu',
    'seller.vouchers_history_title': 'Lịch sử tạo mã giảm giá',
    'seller.voucher_all_materials': 'Tất cả Mã vật liệu',
    'seller.vouchers_empty': 'Bạn chưa tạo mã giảm giá nào.',
    'seller.confirm_delete_voucher': 'Xóa mã giảm giá này?'
  });

  Object.assign(EN, {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.materials': 'Materials',
    'nav.sellers': 'Sellers',
    'nav.faq': 'FAQ',
    'nav.contact': 'Contact',
    'nav.login': 'Log in',
    'nav.dashboard': 'Go to dashboard',
    'nav.cta_start': 'Get started free',
    'nav.search_cta': 'Search now',
    'nav.sell_cta': 'List your materials',
    'footer.tagline': 'AI-powered platform for finding and connecting interior materials.',
    'footer.nav_title': 'Navigation',
    'footer.contact_title': 'Contact',
    'footer.hotline': 'Hotline',
    'footer.follow_title': 'Follow us',
    'footer.copyright': '© 2026 Material AI. All rights reserved.',
    'common.close': 'Close',
    'common.clear_search': 'Clear search',
    'common.verified': 'Verified',
    'common.unverified': 'Unverified',
    'common.office_address': '5th Floor, ABC Building, District 1, Ho Chi Minh City',
    'common.logout': 'Log out',
    'common.back': 'Back',
    'common.send': 'Send',
    'common.edit': 'Edit',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.website_label': 'Website',
    'common.confirm_delete_material': 'Delete this material?',
    'status.pending': 'Pending',
    'status.approved': 'Approved',
    'status.blocked': 'Blocked'
  });

  /* ===== index.html (home) ===== */
  Object.assign(EN, {
    'home.doc_title': 'Material AI – Find interior materials by photo',
    'home.doc_desc': 'Material AI connects interior material sellers (plywood, stone, tile, paint, wood, glass) with customers, architects, and engineers. Upload a photo and find matching materials with AI in seconds.',
    'home.badge': 'AI-powered material search',
    'home.tagline': 'Fast · Accurate · Transparent',
    'home.h1': 'Find the right interior material with just <span class="text-warm">one photo</span>',
    'home.hero_desc': 'Upload a photo of the material you need — Material AI matches it against thousands of plywood, stone, tile, paint, natural wood, and glass samples from sellers, returning the closest options along with prices.',
    'home.cta_upload': 'Upload photo to search',
    'home.cta_for_sellers': 'For sellers',
    'home.cta_browse': 'Browse the material library',
    'home.cta_seller_register': 'Register as a seller',
    'home.stat_sellers': 'sellers',
    'home.stat_materials': 'material samples',
    'home.stat_free': 'free for buyers',
    'home.final_cta_h2': 'Ready to find materials for your project?',
    'home.final_cta_sub': 'Snap or upload one photo — instantly get a list of similar materials with prices from hundreds of sellers.',
    'home.dropzone_title': 'Drag & drop your material photo here',
    'home.dropzone_sub': 'or click to choose a photo from your device',
    'home.dropzone_selected': 'Redirecting to search...',
    'home.help_bubble': 'How can we help you?',
    'home.help_widget_label': 'Help',
    'home.back_to_top_label': 'Back to top',
    'home.features_h2': 'A platform for both sellers and buyers of materials',
    'home.features_sub': 'Three core pillars that help Material AI connect the entire interior materials supply chain.',
    'home.feature1_title': 'Sellers list their materials',
    'home.feature1_desc': 'Upload material samples, specifications (size, thickness, material type), and transparent pricing in just minutes.',
    'home.feature2_title': 'Search by image',
    'home.feature2_desc': 'Customers, architects, and engineers upload a photo of the material they need — AI analyzes texture, color, and material to suggest similar products.',
    'home.feature3_title': 'Compare & connect directly',
    'home.feature3_desc': 'Compare prices and specs across multiple suppliers and connect directly — no middleman.',
    'home.testi_h2': 'Trusted by the interior materials industry',
    'home.testi_sub': 'Feedback from sellers, architects, and customers who use Material AI.',
    'home.testi1_quote': '"Just by photographing a sample of my customer\'s stone, Material AI instantly finds a similar product in my stock. It saves so much consulting time."',
    'home.testi1_role': 'Natural stone seller',
    'home.testi2_quote': '"As a site supervisor, I often need to find a matching replacement material urgently. The image search tool cuts my lookup time significantly."',
    'home.testi2_role': 'Construction site engineer',
    'home.testi3_quote': '"The material catalog has full specs and clear pricing, making it easy to compare and choose the right engineered wood for a residential project."',
    'home.testi3_role': 'Interior architect',
    'home.faq_h2': 'Frequently asked questions',
    'home.faq_sub': 'Common questions about Material AI.',
    'home.faq1_q': 'How does Material AI find similar materials?',
    'home.faq1_a': 'The AI analyzes the color, surface texture, and material in your uploaded photo, then matches it against material data provided by sellers to return the closest results.',
    'home.faq2_q': 'How do sellers list materials on the platform?',
    'home.faq2_a': 'Sellers create an account, upload product photos, enter specifications (size, thickness, origin...) and pricing. The product then appears in the corresponding category on the Materials page.',
    'home.faq3_q': 'What types of materials can I search for?',
    'home.faq3_a': 'Engineered wood, paint, tile, natural stone, natural wood, glass, and many other interior material categories, continuously updated by sellers on the platform.',
    'home.faq4_q': 'Is Material AI free to use?',
    'home.faq4_a': 'Searching and browsing materials is completely free for customers, architects, and engineers. Sellers can choose listing packages that suit their business scale.',
    'home.faq_more_link': 'See all FAQs →'
  });

  /* ===== about.html ===== */
  Object.assign(EN, {
    'about.doc_title': 'About Material AI – Our mission to connect the interior materials industry with AI',
    'about.doc_desc': 'Learn about Material AI\'s mission, feedback from customers, sellers, engineers, and how to reach our team.',
    'about.badge': 'Our mission',
    'about.tagline': 'one platform, every material',
    'about.h1': 'Digitizing all of Vietnam\'s interior material data',
    'about.hero_desc': 'Material AI was built to close the gap between thousands of material sellers and the people who need them — customers, designers, engineers — through image-search technology that makes choosing the right material fast, transparent, and accurate.',
    'about.stat1_label': 'Sellers',
    'about.stat2_label': 'Material samples',
    'about.stat3_label': 'Search accuracy',
    'about.stat4_label': 'Provinces covered',
    'about.testi_h2': 'Voices from the Material AI community',
    'about.testi_sub': 'Feedback from customers, sellers, and engineers using the platform.',
    'about.tab_customer': 'Customers',
    'about.tab_seller': 'Sellers',
    'about.tab_engineer': 'Engineers / Architects',
    'about.c1_quote': '"I just photograph the show-home\'s wood flooring and find a similar type at a better price."',
    'about.c1_name': 'Ms. Hong Anh — Individual customer',
    'about.c2_quote': '"Easy to use interface, clear pricing — no need to call around to multiple places."',
    'about.c2_name': 'Mr. Quoc Bao — Homeowner',
    'about.c3_quote': '"Found the exact tile pattern I liked from a photo I saw online."',
    'about.c3_name': 'Ms. Thu Trang — Customer',
    'about.s1_quote': '"Since listing products on Material AI, the number of inquiries has clearly increased."',
    'about.s1_name': 'Mr. Minh Khoi — Natural stone seller',
    'about.s2_quote': '"Uploading specs and pricing is very fast now, unlike before."',
    'about.s2_name': 'Ms. Bich Ngoc — Paint distributor',
    'about.s3_quote': '"Customers find exactly the product I have in stock, and the close rate is much higher."',
    'about.s3_name': 'Mr. Van Hai — Engineered wood workshop',
    'about.e1_quote': '"When I urgently need a replacement material on site, image search saves a huge amount of time."',
    'about.e1_name': 'Engineer Thanh Tung — Site supervisor',
    'about.e2_quote': '"Full technical specs help me put together a project\'s material dossier much faster."',
    'about.e2_name': 'Ms. Ngoc Lan — Interior architect',
    'about.e3_quote': '"Comparing prices across multiple suppliers on one platform is very convenient."',
    'about.e3_name': 'Engineer Duc Anh — Construction engineer',
    'about.contact_h2': 'Get in touch with us',
    'about.contact_desc': 'Questions about partnerships, listing materials, or product feedback? Send us a message and our team will respond within 24 business hours.',
    'about.contact_cta': 'Send a message'
  });

  /* ===== shared category/list labels ===== */
  Object.assign(EN, {
    'common.all': 'All',
    'common.cat_van': 'Engineered wood',
    'common.cat_son': 'Paint',
    'common.cat_gach': 'Tile',
    'common.cat_da': 'Stone',
    'common.cat_kinh': 'Glass',
    'common.cat_go': 'Natural wood'
  });

  /* ===== faq.html ===== */
  Object.assign(EN, {
    'faq.doc_title': 'FAQ – Frequently Asked Questions about Material AI',
    'faq.doc_desc': 'Answers about AI-powered material search, listing products, payments, and security on Material AI. Find quick answers or contact our support team.',
    'faq.badge': 'FAQ',
    'faq.tagline': 'answers to everything',
    'faq.h1': 'Frequently asked questions',
    'faq.hero_desc': 'Quickly find answers about AI material search, listing products, payments, and security.',
    'faq.search_placeholder': 'Search questions... (e.g. listing, payment, search)',
    'faq.cat_search': 'AI search',
    'faq.cat_sellers': 'Sellers',
    'faq.cat_account': 'Account & Payments',
    'faq.cat_security': 'Security & Data',
    'faq.q1': 'How does Material AI find similar materials?',
    'faq.a1': 'The AI analyzes the color, surface texture, and material in your uploaded photo, then matches it against material data provided by sellers to return the closest results.',
    'faq.q2': 'What types of materials can I search for?',
    'faq.a2': 'Engineered wood, paint, tile, natural stone, natural wood, glass, and many other interior material categories, continuously updated by sellers on the platform.',
    'faq.q3': 'What are the requirements for the AI to recognize my photo accurately?',
    'faq.a3': 'Take a sharp, well-lit close-up photo of the material surface, avoiding obstructions or glare. JPG/PNG format, max 10MB per search.',
    'faq.q4': 'How do sellers list materials on the platform?',
    'faq.a4': 'Sellers create an account, upload product photos, enter specifications (size, thickness, origin...) and pricing. The product then appears in the corresponding category on the Materials page.',
    'faq.q5': 'How many listings are free?',
    'faq.a5': 'The first 5 products are completely free. From the 6th product onward, sellers can choose a paid listing package based on their business scale — see the Contact page for details.',
    'faq.q6': 'How does a seller profile get the "Verified" label?',
    'faq.a6': 'Submit your business license or company identification via the Contact page. The Material AI team verifies it within 2–3 business days before applying the verified label.',
    'faq.q7': 'Is Material AI free to use?',
    'faq.a7': 'Searching and browsing materials is completely free for customers, architects, and engineers. Sellers can choose listing packages that suit their business scale.',
    'faq.q8': 'Does Material AI handle payments between buyers and sellers?',
    'faq.a8': 'No. Material AI is a connection and search platform — price negotiation, ordering, and payment happen directly between the customer and the seller, with no intermediary.',
    'faq.q9': 'How do I change or delete my account?',
    'faq.a9': 'Send a request via the Contact page along with your registered email. Our support team will process account changes or deletion within 48 hours.',
    'faq.q10': 'Are the photos I upload for search stored or shared?',
    'faq.a10': 'Photos are only used for search matching during your session and are not shared with third parties. You can request deletion of your entire search history via the Contact page.',
    'faq.q11': 'Is my contact information made public when I contact a seller?',
    'faq.a11': 'Your information is only sent directly to the seller you choose to contact — it is never shown publicly on your profile or to other users.',
    'faq.empty': 'No matching questions found. Try a different keyword or contact us directly.',
    'faq.cta_h2': "Can't find the answer you need?",
    'faq.cta_desc': 'Send your question directly to the Material AI team — we respond within 24 business hours.',
    'faq.cta_button': 'Contact us'
  });

  /* ===== contact.html ===== */
  Object.assign(EN, {
    'contact.doc_title': 'Contact Material AI – Support for customers & sellers',
    'contact.doc_desc': 'Get in touch with the Material AI team for help with material search, listing products, or business partnerships. Email, hotline, office address, and a contact form.',
    'contact.h1': "We're always here to help",
    'contact.tagline': "Always listening · Always responding",
    'contact.hero_desc': 'Questions about AI material search, listing products, or business partnerships? Send a request to the Material AI team — we respond within 24 business hours.',
    'contact.email_title': 'Support email',
    'contact.hotline_title': 'Hotline',
    'contact.zalo_title': 'Zalo',
    'contact.hotline_hours': 'Mon – Sat, 8:00 AM – 6:00 PM',
    'contact.office_title': 'Office',
    'contact.form_h2': 'Send us a request',
    'contact.form_desc': 'Fill in the form and the Material AI team will get back to you on the right topic — from material search support to seller partnerships.',
    'contact.faq_hint': 'Have a common question? Check the <a href="faq.html" class="text-secondary font-semibold hover:underline">FAQ</a> page before reaching out.',
    'contact.field_name': 'Full name',
    'contact.field_name_placeholder': 'John Smith',
    'contact.field_phone': 'Phone number',
    'contact.field_email': 'Email',
    'contact.field_email_placeholder': 'you@email.com',
    'contact.field_subject': 'Subject',
    'contact.subject1': 'Material search support',
    'contact.subject2': 'Listing / seller partnership',
    'contact.subject3': 'Report a system issue',
    'contact.subject4': 'Other',
    'contact.field_message': 'Message',
    'contact.field_message_placeholder': 'Your message...',
    'contact.submit_button': 'Send message',
    'contact.form_success': "Thank you! Your request has been received — we'll respond as soon as possible."
  });

  /* ===== materials.html ===== */
  Object.assign(EN, {
    'materials.doc_title': 'Interior Materials Catalog – Wood, Stone, Tile, Paint, Glass | Material AI',
    'materials.doc_desc': 'Explore the interior materials catalog from thousands of sellers: engineered wood, paint, tile, stone, glass, natural wood. View specs and prices, or upload a photo to find similar materials.',
    'materials.h1': 'Interior materials catalog',
    'materials.tagline': 'The right material · The right choice',
    'materials.subtitle': 'Browse by category or upload a photo for AI to find the closest match.',
    'materials.upload_label': 'Upload photo to search',
    'materials.pending_title': 'Finding materials similar to your photo',
    'materials.search_placeholder': 'Search by material name, product code...',
    'materials.search_button': 'Search',
    'materials.card1_title': 'MDF board with oak-grain Melamine finish',
    'materials.card1_spec': '18mm thick · Size 1220x2440mm',
    'materials.card1_price': '450,000₫/sheet',
    'materials.card2_title': 'Soft sage green interior paint',
    'materials.card2_spec': '18L · Covers 40-45m²/liter',
    'materials.card2_price': '1,250,000₫/pail',
    'materials.card3_title': 'Marble-look wall & floor tile',
    'materials.card3_spec': '600x600mm · Polished finish',
    'materials.card3_price': '185,000₫/m²',
    'materials.card4_title': 'Natural black granite from Phu Yen',
    'materials.card4_spec': '20mm thick · Polished finish',
    'materials.card4_price': '890,000₫/m²',
    'materials.card5_title': 'Clear tempered glass',
    'materials.card5_spec': '10mm thick · Safety, high load-bearing',
    'materials.card5_price': '620,000₫/m²',
    'materials.card6_title': 'Solid natural oak wood',
    'materials.card6_spec': '25mm thick · Kiln-dried, termite-treated',
    'materials.card6_price': '3,200,000₫/m³',
    'materials.card7_title': 'Phenolic-coated plywood',
    'materials.card7_spec': '12mm thick · Water resistant',
    'materials.card7_price': '380,000₫/sheet',
    'materials.card8_title': 'White marble with cloud veining',
    'materials.card8_spec': '18mm thick · Imported',
    'materials.card8_price': '1,450,000₫/m²',
    'materials.card9_title': 'Kilkenny oak-grain Melamine MFC board',
    'materials.card9_spec': '18mm thick · 1220x2440mm',
    'materials.card9_price': '340,000₫/sheet',
    'materials.card10_title': 'Santana oak-grain Melamine MDF board',
    'materials.card10_spec': '17mm thick · 1220x2440mm',
    'materials.card10_price': '420,000₫/sheet',
    'materials.card11_title': 'Industrial loft-finish Melamine MFC board',
    'materials.card11_spec': '18mm thick · Scratch resistant',
    'materials.card11_price': '395,000₫/sheet',
    'materials.card12_title': 'Smoky blue interior paint',
    'materials.card12_spec': '18L · Covers 40-45m²/liter',
    'materials.card12_price': '1,290,000₫/pail',
    'materials.card13_title': 'Warm terracotta interior paint',
    'materials.card13_spec': '18L · Covers 40-45m²/liter',
    'materials.card13_price': '1,180,000₫/pail',
    'materials.card14_title': 'Neutral cream interior paint',
    'materials.card14_spec': '5L · Covers 40-45m²/liter',
    'materials.card14_price': '450,000₫/pail',
    'materials.card15_title': 'Grey concrete-look wall & floor tile',
    'materials.card15_spec': '600x600mm · Matte finish',
    'materials.card15_price': '165,000₫/m²',
    'materials.card16_title': 'Premium ivory marble-look tile',
    'materials.card16_spec': '800x800mm · Polished mirror finish',
    'materials.card16_price': '245,000₫/m²',
    'materials.card17_title': 'Soft blush marble-look tile',
    'materials.card17_spec': '600x1200mm · Matte finish',
    'materials.card17_price': '210,000₫/m²',
    'materials.card18_title': 'Premium honed black natural stone',
    'materials.card18_spec': '20mm thick · Slip-resistant honed finish',
    'materials.card18_price': '950,000₫/m²',
    'materials.card19_title': 'Deep grey marble with cloud veining',
    'materials.card19_spec': '20mm thick · Imported',
    'materials.card19_price': '1,680,000₫/m²',
    'materials.card20_title': 'Light grey marble with natural veining',
    'materials.card20_spec': '18mm thick · Polished finish',
    'materials.card20_price': '1,120,000₫/m²',
    'materials.find_similar': 'Find similar',
    'materials.empty': 'No matching materials found. Try a different keyword or category.',
    'materials.load_more': 'Show more materials',
    'materials.modal_contact': 'Contact now',
    'materials.modal_view_products': 'View products',
    'materials.products_selling': 'products for sale',
    'materials.add_to_cart': 'Add to cart',
    'materials.added_to_cart': '✓ Added'
  });

  /* ===== cart widget (materials.html, sellers.html) ===== */
  Object.assign(EN, {
    'cart.title': 'Your cart',
    'cart.empty': 'Your cart is empty. Tap "Add to cart" on a material you like.',
    'cart.subtotal': 'Subtotal',
    'cart.grand_total': 'Total',
    'cart.checkout': 'Place order',
    'cart.note': 'Tap "Place order" for each seller to complete checkout — pay on delivery or by direct bank transfer.',
    'cart.clear': 'Clear cart',
    'cart.clear_confirm': 'Clear the entire cart?'
  });

  /* ===== checkout modal (materials.html, sellers.html, ...) ===== */
  Object.assign(EN, {
    'checkout.total': 'Total to pay',
    'checkout.discount': 'Discount',
    'checkout.voucher_label': 'Voucher code (optional)',
    'checkout.voucher_apply': 'Apply',
    'checkout.voucher_invalid': 'Invalid or expired voucher code.',
    'checkout.voucher_applied': 'Voucher applied.',
    'checkout.name_label': "Recipient's name",
    'checkout.phone_label': 'Phone number',
    'checkout.address_label': 'Delivery address',
    'checkout.payment_label': 'Payment method',
    'checkout.payment_cod': 'Cash on delivery (COD)',
    'checkout.payment_bank': 'Bank transfer',
    'checkout.submit': 'Confirm order',
    'checkout.missing_fields': 'Please fill in all delivery details.',
    'checkout.success_title': 'Order placed successfully!',
    'checkout.success_sub': 'The seller will contact you to confirm.'
  });

  /* ===== order status (customer order history + seller order management) ===== */
  Object.assign(EN, {
    'order_status.pending': 'Pending',
    'order_status.confirmed': 'Confirmed',
    'order_status.shipping': 'Shipping',
    'order_status.completed': 'Completed',
    'order_status.cancelled': 'Cancelled'
  });

  /* ===== customer nav dropdown (materials.html, sellers.html, index.html, faq.html, contact.html) ===== */
  Object.assign(EN, {
    'nav_menu.order_history': 'Order history',
    'orders.loading': 'Loading...',
    'orders.empty': "You haven't placed any orders yet."
  });

  /* ===== sellers.html ===== */
  Object.assign(EN, {
    'sellers.doc_title': 'Seller Directory – Interior Materials | Material AI',
    'sellers.doc_desc': 'Explore the directory of interior material sellers on Material AI: engineered wood, paint, tile, stone, glass, natural wood. View full profiles, ratings, and contact details for each seller.',
    'sellers.h1': 'Seller directory',
    'sellers.tagline': 'Partners you can trust',
    'sellers.subtitle': 'Explore interior material seller profiles on Material AI — click a seller to see full details.',
    'sellers.search_placeholder': 'Search by seller name, area...',
    'sellers.modal_address': 'Address',
    'sellers.modal_phone': 'Phone',
    'sellers.modal_email': 'Email',
    'sellers.modal_website': 'Website',
    'sellers.modal_materials_heading': 'Featured materials',
    'sellers.modal_view_all': 'View all materials',
    'sellers.modal_contact_seller': 'Contact seller',
    'sellers.materials_count_short': 'materials',
    'sellers.materials_selling': 'materials for sale',
    'sellers.established': 'Est.',
    'sellers.reviews_label': 'reviews',
    'sellers.years_active': 'years in business'
  });

  /* ===== login.html ===== */
  Object.assign(EN, {
    'login.doc_title': 'Log in – Material AI',
    'login.h1': 'Log in',
    'login.tagline': 'Welcome back',
    'login.email_label': 'Email',
    'login.password_label': 'Password',
    'login.show_password': 'Show password',
    'login.hide_password': 'Hide password',
    'login.submit': 'Log in',
    'login.register_hint': "Don't have an account? <a href=\"register-choice.html\" class=\"text-secondary font-semibold hover:underline\">Register now</a>",
    'login.registered_notice': 'Registration successful! Please log in.',
    'login.reset_notice': 'Password reset successfully! Please log in.',
    'login.forgot_password': 'Forgot password?',
    'login.demo_title': 'Demo accounts to try:',
    'login.demo_seller_label': 'Seller'
  });

  /* ===== forgot-password.html ===== */
  Object.assign(EN, {
    'forgot.doc_title': 'Forgot password – Material AI',
    'forgot.h1': 'Forgot password',
    'forgot.tagline': 'Reset your password',
    'forgot.email_hint': 'Enter your account email to continue.',
    'forgot.continue': 'Continue',
    'forgot.back_to_login': 'Back to login',
    'forgot.reset_hint': 'Set a new password for <span id="resetEmailLabel" class="font-semibold text-ink"></span>.',
    'forgot.new_password_label': 'New password',
    'forgot.confirm_password_label': 'Confirm new password',
    'forgot.submit': 'Reset password',
    'forgot.mismatch_error': 'Passwords do not match.'
  });

  /* ===== register-choice.html ===== */
  Object.assign(EN, {
    'register_choice.doc_title': 'Create an account – Material AI',
    'register_choice.badge': 'Create an account',
    'register_choice.h1': 'Which type of account do you want to create?',
    'register_choice.tagline': 'Pick the account that fits you',
    'register_choice.customer_title': 'Customer',
    'register_choice.customer_desc': 'Save your cart and send purchase requests to sellers.',
    'register_choice.customer_cta': 'Register as a customer',
    'register_choice.seller_title': 'Seller',
    'register_choice.seller_desc': 'List materials, manage your storefront, and chat with customers.',
    'register_choice.seller_cta': 'Register as a seller'
  });

  /* ===== register.html ===== */
  Object.assign(EN, {
    'register.doc_title': 'Seller Registration – Material AI',
    'register.badge': 'For sellers',
    'register.h1': 'Register to sell materials',
    'register.tagline': 'start reaching new customers',
    'register.email_label': 'Login email',
    'register.password_label': 'Password',
    'register.password_placeholder': 'At least 8 characters',
    'register.business_name_label': 'Business name',
    'register.business_name_placeholder': 'ABC Wood Workshop',
    'register.category_label': 'Category',
    'register.phone_label': 'Phone number',
    'register.website_label': 'Website (optional)',
    'register.website_placeholder': 'yourdomain.com',
    'register.address_label': 'Address',
    'register.address_placeholder': 'Street address, district, city/province',
    'register.description_label': 'Short description',
    'register.description_placeholder': 'A few lines about your products and strengths...',
    'register.submit': 'Register',
    'register.login_hint': 'Already have an account? <a href="login.html" class="text-secondary font-semibold hover:underline">Log in</a>',
    'register.customer_hint': 'Are you a customer? <a href="customer-register.html" class="text-secondary font-semibold hover:underline">Register here</a>',
    'register.approval_note': 'After registering, your account must be approved by an admin before you can list materials.'
  });

  /* ===== customer-register.html ===== */
  Object.assign(EN, {
    'customer_register.doc_title': 'Customer Registration – Material AI',
    'customer_register.badge': 'For customers',
    'customer_register.h1': 'Create a customer account',
    'customer_register.tagline': 'Save your cart · Shop anytime',
    'customer_register.name_label': 'Full name',
    'customer_register.login_hint': 'Already have an account? <a href="login.html" class="text-secondary font-semibold hover:underline">Log in</a>',
    'customer_register.seller_hint': 'Are you a seller? <a href="register.html" class="text-secondary font-semibold hover:underline">Register here</a>'
  });

  /* ===== admin-dashboard.html ===== */
  Object.assign(EN, {
    'admin.doc_title': 'Admin Dashboard – Material AI',
    'admin.navbar_title': 'Admin dashboard',
    'admin.menu_overview': 'Overview',
    'admin.menu_dashboard': 'Dashboard',
    'admin.menu_group_manage': 'Management',
    'admin.menu_group_system': 'System',
    'admin.menu_customers': 'Customers',
    'admin.menu_contacts': 'Contact requests',
    'admin.menu_reviews': 'Reviews',
    'admin.menu_settings': 'Settings',
    'admin.coming_soon': 'This feature is under development — coming in an upcoming release.',
    'admin.shortcut_sellers': 'Review pending sellers',
    'admin.shortcut_sellers_desc': 'Approve, block, or remove seller accounts.',
    'admin.shortcut_materials': 'Moderate materials',
    'admin.shortcut_materials_desc': 'Inspect and remove violating materials on the platform.',
    'admin.pending_sellers': 'Pending approvals',
    'admin.no_pending': 'No sellers awaiting approval.',
    'admin.chart_by_category': 'Materials by category',
    'admin.top_sellers': 'Top sellers',
    'admin.latest_materials': 'Latest materials',
    'admin.view_all': 'View all →',
    'admin.stat_customers': 'Customers',
    'admin.stat_orders': 'Orders placed',
    'admin.stat_conversations': 'Chat conversations',
    'admin.stat_messages': 'Messages exchanged',
    'admin.sellers_th_address': 'Address',
    'admin.th_stt': 'No.',
    'admin.no_data': 'No data yet.',
    'admin.customers_th_name': 'Customer',
    'admin.customers_th_email': 'Email',
    'admin.customers_th_status': 'Status',
    'admin.customers_th_orders': 'Orders placed',
    'admin.customers_th_spend': 'Total spend',
    'admin.customers_th_created': 'Created',
    'admin.customers_stat_total': 'Total customers',
    'admin.customers_stat_new_month': 'New this month',
    'admin.customers_stat_orders': 'Total orders',
    'admin.customers_stat_revenue': 'Total revenue',
    'admin.contacts_th_customer': 'Customer',
    'admin.contacts_th_seller': 'Seller',
    'admin.contacts_th_messages': 'Messages',
    'admin.contacts_th_last': 'Last activity',
    'admin.materials_th_unit': 'Unit',
    'admin.h1': 'System administration',
    'admin.tagline': 'The full picture of Material AI',
    'admin.stat_total_sellers': 'Total sellers',
    'admin.stat_materials': 'Total materials',
    'admin.sellers_stat_total': 'Total sellers',
    'admin.sellers_stat_new_month': 'New sellers this month',
    'admin.sellers_th_name': 'Seller',
    'admin.sellers_th_category': 'Category',
    'admin.sellers_th_materials': 'Materials',
    'admin.sellers_th_status': 'Status',
    'admin.th_action': 'Action',
    'admin.materials_th_name': 'Material',
    'admin.materials_th_seller': 'Seller',
    'admin.materials_th_category': 'Category',
    'admin.materials_th_price': 'Price',
    'admin.action_approve': 'Approve',
    'admin.action_block': 'Block',
    'admin.action_unblock': 'Unblock',
    'admin.confirm_delete_seller': 'Delete this seller? All of their materials will also be deleted.'
  });

  /* ===== seller-dashboard.html ===== */
  Object.assign(EN, {
    'seller.orders_th_material': 'Material',
    'seller.orders_th_customer': 'Customer info',
    'seller.orders_th_time': 'Ordered at',
    'seller.orders_th_price': 'Price',
    'seller.orders_th_qty': 'Qty',
    'seller.orders_th_discount': 'Discount',
    'seller.orders_th_total': 'Total',
    'seller.orders_th_status': 'Status',
    'seller.menu_materials': 'Manage materials',
    'seller.material_unit_label': 'Unit',
    'seller.material_unit_placeholder': 'e.g. sheet, m², bucket',
    'seller.material_image_label': 'Photo',
    'seller.material_image_hint': 'Choose or drag & drop a photo',
    'seller.material_image_hint_sub': 'JPG, PNG up to 5MB',
    'seller.material_image_too_large': 'Image is too large (max 5MB).',
    'seller.material_desc_label': 'Description',
    'seller.material_desc_placeholder': 'e.g. Scratch-resistant surface, ideal for kitchen cabinets...',
    'seller.update_material': 'Update material',
    'seller.material_updated': 'Material updated successfully.',
    'seller.confirm_title': 'Confirmation',
    'seller.confirm_add': 'Are you sure you want to publish this material?',
    'seller.confirm_update': 'Are you sure you want to update this material?',
    'seller.material_deleted': 'Material deleted.',
    'seller.menu_group_store': 'Store',
    'seller.menu_group_account': 'Account',
    'seller.menu_messages': 'Messages',
    'seller.menu_profile': 'Profile',
    'seller.doc_title': 'Seller Dashboard – Material AI',
    'seller.navbar_title': 'Seller dashboard',
    'seller.greeting': 'Hello,',
    'seller.tagline': 'manage your storefront',
    'seller.pending_notice': 'Your account is <strong>pending admin approval</strong>. You can update your profile now, but it must be approved before you can list materials.',
    'seller.blocked_notice': 'Your account has been <strong>blocked</strong>. Please contact an administrator if you have questions.',
    'seller.messages_title': 'Customer messages',
    'seller.chat_empty': 'No customer messages yet.',
    'seller.chat_input_placeholder': 'Type a message...',
    'seller.profile_title': 'Seller profile',
    'seller.description_label': 'Description',
    'seller.save_profile': 'Save profile',
    'seller.profile_saved': 'Profile saved.',
    'seller.add_material_title': 'List a new material',
    'seller.material_category_label': 'Category',
    'seller.material_title_label': 'Material name',
    'seller.material_title_placeholder': 'e.g. Oak-grain Melamine MDF board',
    'seller.material_code_label': 'Material code',
    'seller.material_code_placeholder': 'e.g. VAN-MDF-01',
    'seller.material_spec_label': 'Specifications',
    'seller.material_spec_placeholder': 'e.g. 18mm thick · 1220x2440mm',
    'seller.material_price_label': 'Price',
    'seller.material_price_placeholder': 'e.g. 450,000₫',
    'seller.submit_material': 'List material',
    'seller.material_added': 'Material listed.',
    'seller.materials_list_title': 'Materials for sale',
    'seller.materials_empty': "You haven't listed any materials yet.",
    'seller.orders_title': 'Orders',
    'seller.orders_empty': 'No orders yet.',
    'seller.vouchers_title': 'Vouchers',
    'seller.voucher_code_placeholder': 'e.g. SALE10',
    'seller.voucher_type_percent': 'Percentage discount',
    'seller.voucher_type_fixed': 'Fixed amount discount',
    'seller.voucher_value_placeholder': 'e.g. 10',
    'seller.voucher_add': 'Add voucher',
    'seller.voucher_added': 'Voucher added.',
    'seller.voucher_active': 'Active',
    'seller.vouchers_empty': "You haven't created any vouchers yet.",
    'seller.confirm_delete_voucher': 'Delete this voucher?',
    'seller.voucher_code_label': 'Voucher code',
    'seller.voucher_type_label': 'Discount type',
    'seller.voucher_value_label': 'Value',
    'seller.voucher_min_order_label': 'Minimum order',
    'seller.voucher_min_order_placeholder': 'e.g. 500000',
    'seller.voucher_max_discount_label': 'Max discount',
    'seller.voucher_max_discount_placeholder': 'e.g. 100000',
    'seller.voucher_max_discount_hint': 'Only applies to percentage discounts',
    'seller.voucher_usage_limit_label': 'Usage limit',
    'seller.voucher_usage_limit_placeholder': 'e.g. 50',
    'seller.voucher_expires_label': 'Expiry date',
    'seller.voucher_usage_th': 'Used',
    'seller.voucher_no_expiry': 'No expiry',
    'seller.voucher_stat_total': 'Total vouchers',
    'seller.voucher_stat_active': 'Active',
    'seller.voucher_stat_used': 'Total redemptions',
    'seller.voucher_status_active': 'Active',
    'seller.voucher_status_off': 'Disabled',
    'seller.voucher_status_expired': 'Expired',
    'seller.voucher_status_used_up': 'Limit reached',
    'seller.voucher_deactivate': 'Disable',
    'seller.voucher_activate': 'Enable',
    'seller.voucher_deactivated': 'Voucher disabled.',
    'seller.voucher_activated': 'Voucher enabled.',
    'seller.voucher_deleted': 'Voucher deleted.',
    'seller.voucher_material_label': 'Applies to material code',
    'seller.vouchers_history_title': 'Voucher creation history',
    'seller.voucher_all_materials': 'All material codes',
  });
})();
