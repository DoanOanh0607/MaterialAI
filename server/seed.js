// Seed the database with a demo admin account and the 8 sellers already
// shown on sellers.html (plus their listed materials), so the new admin/
// seller dashboards start out reflecting the site's existing demo content.
const bcrypt = require('bcryptjs');
const db = require('./db');

const SPEC_BY_CAT = {
  da: 'Dày 20mm · Bề mặt mài bóng',
  son: '18L · Phủ 40-45m²/lít',
  van: 'Dày 18mm · Kích thước 1220x2440mm',
  gach: '600x600mm · Bề mặt bóng gương',
  kinh: 'Dày 10mm · An toàn, chịu lực cao',
  go: 'Dày 25mm · Đã sấy tẩm chống mối'
};
const PRICE_BY_CAT = {
  da: (i) => `${(800 + i * 150).toLocaleString('vi-VN')}.000đ/m²`,
  son: (i) => `${(950 + i * 200).toLocaleString('vi-VN')}.000đ/thùng`,
  van: (i) => `${(320 + i * 60).toLocaleString('vi-VN')}.000đ/tấm`,
  gach: (i) => `${(150 + i * 40).toLocaleString('vi-VN')}.000đ/m²`,
  kinh: (i) => `${(550 + i * 90).toLocaleString('vi-VN')}.000đ/m²`,
  go: (i) => `${(2800 + i * 300).toLocaleString('vi-VN')}.000đ/m³`
};

const SELLERS = [
  {
    email: 'minhkhoi@daminhkhoi.vn', cat: 'da', name: 'Đá Tự Nhiên Minh Khôi', initials: 'MK',
    coverClass: 'bg-secondary-50', logoClass: 'bg-secondary-50 text-secondary',
    desc: 'Chuyên cung cấp đá granite, marble tự nhiên khai thác trực tiếp từ Phú Yên, Bình Định. Hơn 10 năm kinh nghiệm cung ứng cho các công trình nhà ở và thương mại trên toàn quốc.',
    address: '123 Lê Văn Sỹ, Q. Phú Nhuận, TP. Hồ Chí Minh', phone: '+84 909 111 222', website: 'daminhkhoi.vn',
    materials: ['Granite đen Phú Yên', 'Marble trắng vân mây', 'Đá bazan xám', 'Marble kem Ý']
  },
  {
    email: 'lienhe@sonbichngoc.vn', cat: 'son', name: 'Sơn Bích Ngọc', initials: 'BN',
    coverClass: 'bg-accent-50', logoClass: 'bg-accent-50 text-accent-600',
    desc: 'Đại lý phân phối sơn nội – ngoại thất cao cấp, chuyên các dòng sơn bóng mờ, chống ẩm và sơn trang trí hiệu ứng cho các dự án căn hộ, biệt thự.',
    address: '45 Nguyễn Trãi, Q.5, TP. Hồ Chí Minh', phone: '+84 908 222 333', website: 'sonbichngoc.vn',
    materials: ['Sơn bóng mờ cao cấp', 'Sơn chống ẩm', 'Sơn hiệu ứng bê tông']
  },
  {
    email: 'kinhdoanh@vanvanhai.vn', cat: 'van', name: 'Xưởng Ván Văn Hải', initials: 'VH',
    coverClass: 'bg-secondary-50', logoClass: 'bg-secondary-50 text-secondary',
    desc: 'Sản xuất và phân phối ván MDF, MFC, Plywood phủ Melamine/Laminate với đa dạng vân màu, phục vụ ngành sản xuất nội thất và thi công trọn gói.',
    address: '78 Quốc lộ 1A, Bình Tân, TP. Hồ Chí Minh', phone: '+84 907 333 444', website: 'vanvanhai.vn',
    materials: ['MDF phủ Melamine vân sồi', 'Plywood phủ Phenolic', 'MFC chống ẩm', 'Ván Laminate vân đá']
  },
  {
    email: 'sales@gachdonga.vn', cat: 'gach', name: 'Gạch Ốp Lát Đông Á', initials: 'DA',
    coverClass: 'bg-accent-50', logoClass: 'bg-accent-50 text-accent-600',
    desc: 'Nhà phân phối gạch ốp lát vân đá marble, gạch bóng gương và gạch trang trí nhập khẩu, phục vụ các công trình nhà ở, showroom, khách sạn.',
    address: '212 Cách Mạng Tháng 8, Q.10, TP. Hồ Chí Minh', phone: '+84 906 444 555', website: 'gachdonga.vn',
    materials: ['Gạch vân đá marble 600x600', 'Gạch bóng gương', 'Gạch trang trí mosaic']
  },
  {
    email: 'contact@kinhphuclong.vn', cat: 'kinh', name: 'Kính An Toàn Phúc Long', initials: 'PL',
    coverClass: 'bg-secondary-50', logoClass: 'bg-secondary-50 text-secondary',
    desc: 'Chuyên gia công kính cường lực, kính dán an toàn, kính phản quang cho vách ngăn, cầu thang, mặt dựng công trình dân dụng và thương mại.',
    address: '9 Điện Biên Phủ, Bình Thạnh, TP. Hồ Chí Minh', phone: '+84 905 555 666', website: 'kinhphuclong.vn',
    materials: ['Kính cường lực trong suốt', 'Kính dán an toàn 2 lớp', 'Kính phản quang xanh']
  },
  {
    email: 'go.ducanh@gmail.com', cat: 'go', name: 'Gỗ Tự Nhiên Đức Anh', initials: 'DA',
    coverClass: 'bg-accent-50', logoClass: 'bg-accent-50 text-accent-600',
    desc: 'Cung cấp gỗ sồi, gỗ óc chó, gỗ căm xe nguyên tấm đã qua xử lý sấy tẩm chống mối mọt, phục vụ đóng đồ nội thất cao cấp và sàn gỗ.',
    address: '56 Phạm Văn Đồng, Thủ Đức, TP. Hồ Chí Minh', phone: '+84 904 666 777', website: 'goducanh.vn',
    materials: ['Gỗ sồi tự nhiên nguyên tấm', 'Gỗ óc chó nhập khẩu', 'Gỗ căm xe sấy tẩm']
  },
  {
    email: 'info@thanhphatnt.vn', cat: 'van', name: 'Nội Thất Thành Phát', initials: 'TP',
    coverClass: 'bg-secondary-50', logoClass: 'bg-secondary-50 text-secondary',
    desc: 'Cung cấp ván công nghiệp và phụ kiện nội thất cho xưởng sản xuất, ưu tiên hàng có sẵn kho, giao nhanh trong 24h nội thành.',
    address: '33 Lũy Bán Bích, Tân Phú, TP. Hồ Chí Minh', phone: '+84 903 777 888', website: 'thanhphatnt.vn',
    materials: ['Ván MFC phủ nhựa', 'Ván ép chịu nước']
  },
  {
    email: 'giabao@marbleitaly.vn', cat: 'da', name: 'Đá Marble Ý Gia Bảo', initials: 'GB',
    coverClass: 'bg-accent-50', logoClass: 'bg-accent-50 text-accent-600',
    desc: 'Nhập khẩu và phân phối đá marble cao cấp trực tiếp từ Ý, phục vụ các dự án biệt thự, khách sạn 5 sao và showroom sang trọng.',
    address: '19 Trường Sơn, Tân Bình, TP. Hồ Chí Minh', phone: '+84 902 888 999', website: 'marbleitaly.vn',
    materials: ['Marble Ý kem vân vàng', 'Marble Ý trắng Carrara', 'Marble Ý xám Bardiglio']
  }
];

const DEMO_PASSWORD = 'MaterialAI@2026';
const ADMIN_PASSWORD = 'Admin@2026';

function run() {
  const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (userCount > 0) {
    console.log('Database already seeded, skipping. Delete server/data.sqlite to reseed.');
    return;
  }

  const insertUser = db.prepare(
    'INSERT INTO users (email, password_hash, role, status) VALUES (?, ?, ?, ?)'
  );
  const insertProfile = db.prepare(
    `INSERT INTO seller_profiles (user_id, business_name, initials, category, description, address, phone, website, cover_class, logo_class)
     VALUES (@user_id, @business_name, @initials, @category, @description, @address, @phone, @website, @cover_class, @logo_class)`
  );
  const insertMaterial = db.prepare(
    'INSERT INTO materials (seller_id, category, title, spec, price) VALUES (?, ?, ?, ?, ?)'
  );

  const adminHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  insertUser.run('admin@materialai.vn', adminHash, 'admin', 'approved');

  const demoHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const seedTx = db.transaction(() => {
    for (const s of SELLERS) {
      const info = insertUser.run(s.email, demoHash, 'seller', 'approved');
      const userId = info.lastInsertRowid;
      insertProfile.run({
        user_id: userId,
        business_name: s.name,
        initials: s.initials,
        category: s.cat,
        description: s.desc,
        address: s.address,
        phone: s.phone,
        website: s.website,
        cover_class: s.coverClass,
        logo_class: s.logoClass
      });
      s.materials.forEach((title, i) => {
        insertMaterial.run(userId, s.cat, title, SPEC_BY_CAT[s.cat], PRICE_BY_CAT[s.cat](i));
      });
    }
  });
  seedTx();

  console.log('Seed complete.');
  console.log('Admin login   -> admin@materialai.vn / ' + ADMIN_PASSWORD);
  console.log('Seller login  -> any seller email above / ' + DEMO_PASSWORD);
  console.log('(e.g. minhkhoi@daminhkhoi.vn / ' + DEMO_PASSWORD + ')');
}

run();
