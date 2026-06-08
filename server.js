const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Bỏ qua trang cảnh báo của ngrok khi gọi API
app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

// Cho phép mở file HTML
app.use(express.static(__dirname));

// Cấu hình SQL Server
const config = {
  user: "sa",
  password: "123456",
  server: "localhost",
  port: 1433,
  database: "TrungTam",
  requestTimeout: 60000,
  connectionTimeout: 30000,
  pool: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

// Kết nối SQL
sql.connect(config)
  .then(() => {
    console.log("Kết nối SQL thành công");
  })
  .catch(err => {
    console.log("Lỗi kết nối SQL:", err);
  });

// Chạy server
app.listen(3000, "0.0.0.0", () => {
  console.log("Server chạy tại http://0.0.0.0:3000");
});

// Trang chủ
app.get("/", (req, res) => {
  res.send("Server OK");
});

// Lớp học
app.get("/lophoc", async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT 
        LopHoc.MaLop,
        LopHoc.TenLop,
        LopHoc.HocPhi,
        LopHoc.MoTa,
        LopHoc.SoLuongToiDa,
        LopHoc.NgayBatDau,
        LopHoc.NgayKetThuc,
        GiaoVien.TenGV
      FROM LopHoc
      JOIN GiaoVien ON LopHoc.MaGV = GiaoVien.MaGV
    `);
    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Sửa lớp học
app.put("/lophoc/:id", async (req, res) => {
  try {
    const MaLop = parseInt(req.params.id);
    const {
      TenLop,
      MaGV,
      HocPhi,
      MoTa,
      SoLuongToiDa,
      NgayBatDau,
      NgayKetThuc
    } = req.body;

    const request = new sql.Request();
    request.input("MaLop", sql.Int, MaLop);
    request.input("TenLop", sql.NVarChar, TenLop);
    request.input("MaGV", sql.Int, parseInt(MaGV));
    request.input("HocPhi", sql.Decimal, parseFloat(HocPhi) || 0);
    request.input("MoTa", sql.NVarChar, MoTa || null);
    request.input("SoLuongToiDa", sql.Int, SoLuongToiDa ? parseInt(SoLuongToiDa) : null);
    request.input("NgayBatDau", sql.Date, NgayBatDau || null);
    request.input("NgayKetThuc", sql.Date, NgayKetThuc || null);

    await request.query(`
      UPDATE LopHoc
      SET
        TenLop = @TenLop,
        MaGV = @MaGV,
        HocPhi = @HocPhi,
        MoTa = @MoTa,
        SoLuongToiDa = @SoLuongToiDa,
        NgayBatDau = @NgayBatDau,
        NgayKetThuc = @NgayKetThuc
      WHERE MaLop = @MaLop;

      UPDATE HocPhi
      SET SoTien = @HocPhi
      WHERE MaLop = @MaLop;
    `);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Thêm lớp học
app.post("/lophoc", async (req, res) => {
  try {
    const {
      TenLop,
      MaGV,
      HocPhi,
      MoTa,
      SoLuongToiDa,
      NgayBatDau,
      NgayKetThuc
    } = req.body;

    if (!TenLop) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập tên lớp." });
    }

    const request = new sql.Request();
    request.input("TenLop", sql.NVarChar, TenLop);
    request.input("MaGV", sql.Int, MaGV || null);
    request.input("HocPhi", sql.Decimal, parseFloat(HocPhi) || 0);
    request.input("MoTa", sql.NVarChar, MoTa || null);
    request.input("SoLuongToiDa", sql.Int, SoLuongToiDa || null);
    request.input("NgayBatDau", sql.Date, NgayBatDau || null);
    request.input("NgayKetThuc", sql.Date, NgayKetThuc || null);

    const result = await request.query(`
      INSERT INTO LopHoc
      (
        TenLop,
        MaGV,
        HocPhi,
        MoTa,
        SoLuongToiDa,
        NgayBatDau,
        NgayKetThuc
      )
      VALUES
      (
        @TenLop,
        @MaGV,
        @HocPhi,
        @MoTa,
        @SoLuongToiDa,
        @NgayBatDau,
        @NgayKetThuc
      );
      SELECT SCOPE_IDENTITY() AS MaLop;
    `);

    const MaLop = result.recordset[0].MaLop;
    res.json({ success: true, MaLop });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Xóa lớp học
app.delete("/lophoc/:id", async (req, res) => {
  try {
    const MaLop = parseInt(req.params.id);
    const request = new sql.Request();
    request.input("MaLop", sql.Int, MaLop);

    await request.query(`
      DELETE FROM LopHoc WHERE MaLop = @MaLop;
      DELETE FROM HocPhi WHERE MaLop = @MaLop;
      DELETE FROM Diem WHERE MaLop = @MaLop;
      DELETE FROM LichHoc WHERE MaLop = @MaLop;
      DELETE FROM DangKy WHERE MaLop = @MaLop;
    `);
    res.json({ success: true, message: "Xóa lớp học thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Học viên
app.get("/hocvien", async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT * FROM HocVien ORDER BY MaHV
    `);
    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Sửa học viên
app.put("/hocvien/:id", async (req, res) => {
  try {
    const MaHV = parseInt(req.params.id);
    const {
      TenHV,
      NgaySinh,
      GioiTinh,
      DiaChi,
      DienThoai,
      Email,
      TrangThai
    } = req.body;

    const request = new sql.Request();
    request.input("MaHV", sql.Int, MaHV);
    request.input("TenHV", sql.NVarChar, TenHV);
    request.input("NgaySinh", sql.Date, NgaySinh || null);
    request.input("GioiTinh", sql.NVarChar, GioiTinh || null);
    request.input("DiaChi", sql.NVarChar, DiaChi || null);
    request.input("DienThoai", sql.VarChar, DienThoai || null);
    request.input("Email", sql.VarChar, Email || null);
    request.input("TrangThai", sql.NVarChar, TrangThai || null);

    await request.query(`
      UPDATE HocVien
      SET
        TenHV = @TenHV,
        NgaySinh = @NgaySinh,
        GioiTinh = @GioiTinh,
        DiaChi = @DiaChi,
        DienThoai = @DienThoai,
        Email = @Email,
        TrangThai = @TrangThai
      WHERE MaHV = @MaHV
    `);
    res.json({ success: true, message: "Cập nhật học viên thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Thêm học viên
app.post("/hocvien", async (req, res) => {
  try {
    const {
      TenHV,
      NgaySinh,
      GioiTinh,
      DiaChi,
      DienThoai,
      Email,
      TrangThai
    } = req.body;

    if (!TenHV) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập họ tên." });
    }

    const request = new sql.Request();
    request.input("TenHV", sql.NVarChar, TenHV);
    request.input("NgaySinh", sql.Date, NgaySinh || null);
    request.input("GioiTinh", sql.NVarChar, GioiTinh || null);
    request.input("DiaChi", sql.NVarChar, DiaChi || null);
    request.input("DienThoai", sql.VarChar, DienThoai || null);
    request.input("Email", sql.VarChar, Email || null);
    request.input("TrangThai", sql.NVarChar, TrangThai || null);

    const result = await request.query(`
      INSERT INTO HocVien
      (
        TenHV,
        NgaySinh,
        GioiTinh,
        DiaChi,
        DienThoai,
        Email,
        TrangThai
      )
      VALUES
      (
        @TenHV,
        @NgaySinh,
        @GioiTinh,
        @DiaChi,
        @DienThoai,
        @Email,
        @TrangThai
      );
      SELECT SCOPE_IDENTITY() AS MaHV;
    `);

    const MaHV = result.recordset[0].MaHV;
    res.json({ success: true, MaHV, message: "Thêm học viên thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Xóa học viên
app.delete("/hocvien/:id", async (req, res) => {
  try {
    const MaHV = parseInt(req.params.id);
    const request = new sql.Request();
    request.input("MaHV", sql.Int, MaHV);

    await request.query(`
      DELETE FROM Diem WHERE MaHV = @MaHV;
      DELETE FROM HocPhi WHERE MaHV = @MaHV;
      DELETE FROM DangKy WHERE MaHV = @MaHV;
      DELETE FROM HocVien WHERE MaHV = @MaHV;
    `);
    res.json({ success: true, message: "Xóa học viên thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Giáo viên
app.get("/giaovien", async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT * FROM GiaoVien ORDER BY MaGV
    `);
    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Sửa giáo viên
app.put("/giaovien/:id", async (req, res) => {
  try {
    const MaGV = parseInt(req.params.id);
    const {
      TenGV,
      NgaySinh,
      GioiTinh,
      DienThoai,
      Email,
      ChuyenMon,
      Luong
    } = req.body;

    const request = new sql.Request();
    request.input("MaGV", sql.Int, MaGV);
    request.input("TenGV", sql.NVarChar, TenGV);
    request.input("NgaySinh", sql.Date, NgaySinh || null);
    request.input("GioiTinh", sql.NVarChar, GioiTinh || null);
    request.input("DienThoai", sql.VarChar, DienThoai || null);
    request.input("Email", sql.VarChar, Email || null);
    request.input("ChuyenMon", sql.NVarChar, ChuyenMon || null);
    request.input("Luong", sql.Decimal, parseFloat(Luong) || null);

    await request.query(`
      UPDATE GiaoVien
      SET
        TenGV     = @TenGV,
        NgaySinh  = @NgaySinh,
        GioiTinh  = @GioiTinh,
        DienThoai = @DienThoai,
        Email     = @Email,
        ChuyenMon = @ChuyenMon,
        Luong     = @Luong
      WHERE MaGV = @MaGV;
    `);
    res.json({ success: true, message: "Cập nhật giáo viên thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Thêm giáo viên
app.post("/giaovien", async (req, res) => {
  try {
    const {
      TenGV,
      NgaySinh,
      GioiTinh,
      DienThoai,
      Email,
      ChuyenMon,
      Luong
    } = req.body;

    if (!TenGV) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập họ tên." });
    }

    const request = new sql.Request();
    request.input("TenGV", sql.NVarChar, TenGV);
    request.input("NgaySinh", sql.Date, NgaySinh || null);
    request.input("GioiTinh", sql.NVarChar, GioiTinh || null);
    request.input("DienThoai", sql.VarChar, DienThoai || null);
    request.input("Email", sql.VarChar, Email || null);
    request.input("ChuyenMon", sql.NVarChar, ChuyenMon || null);
    request.input("Luong", sql.Decimal, parseFloat(Luong) || null);

    const result = await request.query(`
      INSERT INTO GiaoVien
      (
        TenGV,
        NgaySinh,
        GioiTinh,
        DienThoai,
        Email,
        ChuyenMon,
        Luong
      )
      VALUES
      (
        @TenGV,
        @NgaySinh,
        @GioiTinh,
        @DienThoai,
        @Email,
        @ChuyenMon,
        @Luong
      );
      SELECT SCOPE_IDENTITY() AS MaGV;
    `);

    const MaGV = result.recordset[0].MaGV;
    res.json({ success: true, MaGV, message: "Thêm giáo viên thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Xóa giáo viên
app.delete("/giaovien/:id", async (req, res) => {
  try {
    const MaGV = parseInt(req.params.id);
    const request = new sql.Request();
    request.input("MaGV", sql.Int, MaGV);

    await request.query(`
      DELETE FROM GiaoVien WHERE MaGV = @MaGV;
    `);
    res.json({ success: true, message: "Xóa giáo viên thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Học phí
app.get("/hocphi", async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT 
        HocPhi.MaHP,
        HocVien.MaHV,
        HocVien.TenHV,
        LopHoc.MaLop,
        LopHoc.TenLop,
        HocPhi.SoTien,
        HocPhi.TrangThai,
        HocPhi.NgayDong
      FROM HocPhi
      JOIN HocVien ON HocPhi.MaHV = HocVien.MaHV
      JOIN LopHoc ON HocPhi.MaLop = LopHoc.MaLop
      ORDER BY LopHoc.TenLop, HocVien.TenHV
    `);
    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Sửa học phí
app.put("/hocphi/:id", async (req, res) => {
  try {
    const MaHP = parseInt(req.params.id);
    const { TrangThai, NgayDong } = req.body;

    const request = new sql.Request();
    request.input("MaHP", sql.Int, MaHP);
    request.input("TrangThai", sql.NVarChar, TrangThai);
    request.input("NgayDong", sql.Date, NgayDong || null);

    await request.query(`
      UPDATE HocPhi
      SET
        TrangThai = @TrangThai,
        NgayDong = @NgayDong
      WHERE MaHP = @MaHP;
    `);
    res.json({ success: true, message: "Cập nhật học phí thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Xác nhận đóng học phí
app.put("/hocphi/:id/confirm", async (req, res) => {
  try {
    const MaHP = parseInt(req.params.id);
    const today = new Date().toISOString().split('T')[0];
    const request = new sql.Request();
    request.input("MaHP", sql.Int, MaHP);
    request.input("NgayDong", sql.Date, today);
    await request.query(`
      UPDATE HocPhi
      SET TrangThai = N'Đã đóng', NgayDong = @NgayDong
      WHERE MaHP = @MaHP
    `);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Điểm
app.get("/diem", async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT 
        Diem.MaDiem,
        HocVien.MaHV,
        HocVien.TenHV,
        LopHoc.MaLop,
        LopHoc.TenLop,
        Diem.DiemThuongXuyen1,
        Diem.DiemThuongXuyen2,
        Diem.DiemGiuaKy,
        Diem.DiemCuoiKy,
        ROUND(
          (
            ISNULL(Diem.DiemThuongXuyen1, 0) +
            ISNULL(Diem.DiemThuongXuyen2, 0) +
            ISNULL(Diem.DiemGiuaKy, 0) * 2 +
            ISNULL(Diem.DiemCuoiKy, 0) * 3
          ) / 7.0, 2
        ) AS DiemTongKet
      FROM Diem
      JOIN HocVien ON Diem.MaHV = HocVien.MaHV
      JOIN LopHoc ON Diem.MaLop = LopHoc.MaLop
      ORDER BY LopHoc.TenLop, HocVien.TenHV
    `);
    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lấy 1 bản ghi điểm theo id
app.get("/diem/:id", async (req, res) => {
  try {
    const request = new sql.Request();
    request.input("MaDiem", sql.Int, parseInt(req.params.id));
    const result = await request.query(`
      SELECT Diem.MaDiem, HocVien.MaHV, LopHoc.TenLop, LopHoc.MaLop,
        Diem.DiemThuongXuyen1, Diem.DiemThuongXuyen2,
        Diem.DiemGiuaKy, Diem.DiemCuoiKy,
        ROUND(
          (
            ISNULL(Diem.DiemThuongXuyen1, 0) +
            ISNULL(Diem.DiemThuongXuyen2, 0) +
            ISNULL(Diem.DiemGiuaKy, 0) * 2 +
            ISNULL(Diem.DiemCuoiKy, 0) * 3
          ) / 7.0, 2
        ) AS DiemTongKet,
        Diem.NhanXet
      FROM Diem
      JOIN HocVien ON Diem.MaHV = HocVien.MaHV
      JOIN LopHoc  ON Diem.MaLop = LopHoc.MaLop
      WHERE Diem.MaDiem = @MaDiem
    `);
    res.json(result.recordset[0] || null);
  } catch(err) { 
    console.log(err);
    res.status(500).json({ success: false, message: err.message }); 
  }
});

// Sửa điểm
app.put("/diem/:id", async (req, res) => {
  try {
    const MaDiem = parseInt(req.params.id);
    const {
      DiemThuongXuyen1,
      DiemThuongXuyen2,
      DiemGiuaKy,
      DiemCuoiKy,
      NhanXet
    } = req.body;

    const request = new sql.Request();
    request.input("MaDiem", sql.Int, MaDiem);
    request.input("TX1", sql.Float, DiemThuongXuyen1 || null);
    request.input("TX2", sql.Float, DiemThuongXuyen2 || null);
    request.input("GK", sql.Float, DiemGiuaKy || null);
    request.input("CK", sql.Float, DiemCuoiKy || null);
    request.input("NhanXet", sql.NVarChar, NhanXet || null);

    await request.query(`
      UPDATE Diem
      SET
        DiemThuongXuyen1 = @TX1,
        DiemThuongXuyen2 = @TX2,
        DiemGiuaKy = @GK,
        DiemCuoiKy = @CK,
        NhanXet = @NhanXet
      WHERE MaDiem = @MaDiem
    `);
    res.json({ success: true, message: "Cập nhật điểm thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Thêm điểm
app.post("/diem", async (req, res) => {
  try {
    const {
      MaHV,
      MaLop,
      DiemThuongXuyen1,
      DiemThuongXuyen2,
      DiemGiuaKy,
      DiemCuoiKy
    } = req.body;

    const request = new sql.Request();
    request.input("MaHV", sql.Int, MaHV);
    request.input("MaLop", sql.Int, MaLop);
    request.input("TX1", sql.Float, DiemThuongXuyen1 || null);
    request.input("TX2", sql.Float, DiemThuongXuyen2 || null);
    request.input("GK", sql.Float, DiemGiuaKy || null);
    request.input("CK", sql.Float, DiemCuoiKy || null);

    const result = await request.query(`
      INSERT INTO Diem
      (
        MaHV,
        MaLop,
        DiemThuongXuyen1,
        DiemThuongXuyen2,
        DiemGiuaKy,
        DiemCuoiKy
      )
      VALUES
      (
        @MaHV,
        @MaLop,
        @TX1,
        @TX2,
        @GK,
        @CK
      );
      SELECT SCOPE_IDENTITY() AS MaDiem;
    `);

    const MaDiem = result.recordset[0].MaDiem;
    res.json({ success: true, MaDiem, message: "Thêm điểm thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Tổng hợp
app.get("/full", async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT 
        HocVien.MaHV,
        HocVien.TenHV,
        HocVien.TrangThai,
        LopHoc.MaLop,
        LopHoc.TenLop,
        GiaoVien.TenGV,
        Diem.MaDiem,
        Diem.DiemThuongXuyen1,
        Diem.DiemThuongXuyen2,
        Diem.DiemGiuaKy,
        Diem.DiemCuoiKy,
        ROUND(
          (
            ISNULL(Diem.DiemThuongXuyen1, 0) +
            ISNULL(Diem.DiemThuongXuyen2, 0) +
            ISNULL(Diem.DiemGiuaKy, 0) * 2 +
            ISNULL(Diem.DiemCuoiKy, 0) * 3
          ) / 7.0, 2
        ) AS DiemTongKet,
        HocPhi.TrangThai AS TrangThaiHP
      FROM LopHoc
      LEFT JOIN GiaoVien ON LopHoc.MaGV = GiaoVien.MaGV
      LEFT JOIN DangKy ON LopHoc.MaLop = DangKy.MaLop
      LEFT JOIN HocVien ON DangKy.MaHV = HocVien.MaHV
      LEFT JOIN Diem ON Diem.MaHV = HocVien.MaHV AND Diem.MaLop = LopHoc.MaLop
      LEFT JOIN HocPhi ON HocPhi.MaHV = HocVien.MaHV AND HocPhi.MaLop = LopHoc.MaLop
      ORDER BY LopHoc.MaLop, HocVien.TenHV
    `);
    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cập nhật trạng thái học viên
app.put("/trangthai-hocvien/:id", async (req, res) => {
  try {
    const MaHV = parseInt(req.params.id);
    const { TrangThai } = req.body;

    const request = new sql.Request();
    request.input("MaHV", sql.Int, MaHV);
    request.input("TrangThai", sql.NVarChar, TrangThai);

    await request.query(`
      UPDATE HocVien
      SET TrangThai = @TrangThai
      WHERE MaHV = @MaHV
    `);
    res.json({ success: true, message: "Cập nhật trạng thái thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Đăng ký
// Đăng ký học viên vào lớp - AUTO TẠO HOCPHI VÀ DIEM
app.post("/dangky", async (req, res) => {
  try {
    const { MaHV, MaLop } = req.body;

    if (!MaHV || !MaLop) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }

    const request = new sql.Request();
    request.input("MaHV", sql.Int, parseInt(MaHV));
    request.input("MaLop", sql.Int, parseInt(MaLop));

    // Kiểm tra đã tồn tại chưa
    const check = await request.query(`
      SELECT COUNT(*) AS SoLuong FROM DangKy
      WHERE MaHV = @MaHV AND MaLop = @MaLop
    `);

    if (check.recordset[0].SoLuong > 0) {
      return res.json({ success: false, message: "Học viên này đã tham gia lớp rồi." });
    }

    // Đăng ký lớp
    await request.query(`
      INSERT INTO DangKy (MaHV, MaLop, TrangThai)
      VALUES (@MaHV, @MaLop, N'Đang học')
    `);

    // Thêm học phí (nếu chưa có)
    await request.query(`
      INSERT INTO HocPhi (MaHV, MaLop, SoTien, TrangThai)
      SELECT @MaHV, @MaLop, HocPhi, N'Chưa đóng'
      FROM LopHoc
      WHERE MaLop = @MaLop
        AND NOT EXISTS (
          SELECT 1 FROM HocPhi hp
          WHERE hp.MaHV = @MaHV AND hp.MaLop = @MaLop
        )
    `);

    // Thêm bảng điểm (nếu chưa có)
    await request.query(`
      INSERT INTO Diem (MaHV, MaLop)
      SELECT @MaHV, @MaLop
      WHERE NOT EXISTS (
        SELECT 1 FROM Diem d
        WHERE d.MaHV = @MaHV AND d.MaLop = @MaLop
      )
    `);

    res.json({ success: true, message: "Thêm học viên vào lớp thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Xem học viên theo lớp
app.get("/hocvien-theo-lop/:id", async (req, res) => {
  try {
    const MaLop = parseInt(req.params.id);
    const request = new sql.Request();
    request.input("MaLop", sql.Int, MaLop);

    const result = await request.query(`
      SELECT 
        HocVien.MaHV,
        HocVien.TenHV,
        LopHoc.TenLop
      FROM DangKy
      JOIN HocVien ON DangKy.MaHV = HocVien.MaHV
      JOIN LopHoc ON DangKy.MaLop = LopHoc.MaLop
      WHERE LopHoc.MaLop = @MaLop
    `);
    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Xóa khỏi lớp
app.delete("/dangky/:MaHV/:MaLop", async (req, res) => {
  try {
    const MaHV = parseInt(req.params.MaHV);
    const MaLop = parseInt(req.params.MaLop);

    const request = new sql.Request();
    request.input("MaHV", sql.Int, MaHV);
    request.input("MaLop", sql.Int, MaLop);

    await request.query(`
      DELETE FROM Diem WHERE MaHV = @MaHV AND MaLop = @MaLop;
      DELETE FROM HocPhi WHERE MaHV = @MaHV AND MaLop = @MaLop;
      DELETE FROM DangKy WHERE MaHV = @MaHV AND MaLop = @MaLop;
    `);
    res.json({ success: true, message: "Xóa học viên khỏi lớp thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Đăng nhập
app.post("/login", async (req, res) => {
  try {
    const { TenDangNhap, MatKhau } = req.body;

    if (!TenDangNhap || !MatKhau) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập tài khoản và mật khẩu." });
    }

    const request = new sql.Request();
    request.input("Username", sql.VarChar, TenDangNhap);
    request.input("Password", sql.VarChar, MatKhau);

    const result = await request.query(`
      SELECT * FROM TaiKhoan
      WHERE Username = @Username AND Password = @Password
    `);

    if (result.recordset.length > 0) {
      res.json({
        success: true,
        user: result.recordset[0]
      });
    } else {
      res.json({
        success: false,
        message: "Sai tài khoản hoặc mật khẩu"
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});
// TRANG HỌC VIÊN
app.get("/hocvien/:MaHV", async (req, res) => {
  try {
    const MaHV = parseInt(req.params.MaHV);
    const request = new sql.Request();
    request.input("MaHV", sql.Int, MaHV);

    const result = await request.query(`
      SELECT
        hv.MaHV,
        hv.TenHV,
        hv.NgaySinh,
        hv.GioiTinh,
        hv.Email,
        hv.DienThoai,
        hv.DiaChi,
        hv.TrangThai,
        hv.NgayNhapHoc,
        COUNT(DISTINCT dk.MaLop) AS SoLopHoc,
        ISNULL(AVG(
          (
            ISNULL(d.DiemThuongXuyen1, 0) +
            ISNULL(d.DiemThuongXuyen2, 0) +
            ISNULL(d.DiemGiuaKy, 0) * 2 +
            ISNULL(d.DiemCuoiKy, 0) * 3
          ) / 7.0
        ), 0) AS DiemTB,
        COUNT(
          DISTINCT CASE
            WHEN hp.TrangThai = N'Chưa đóng'
            THEN hp.MaLop
          END
        ) AS HocPhiNo
      FROM HocVien hv
      LEFT JOIN DangKy dk ON hv.MaHV = dk.MaHV
      LEFT JOIN Diem d ON hv.MaHV = d.MaHV
      LEFT JOIN HocPhi hp ON hv.MaHV = hp.MaHV
      WHERE hv.MaHV = @MaHV
      GROUP BY
        hv.MaHV,
        hv.TenHV,
        hv.NgaySinh,
        hv.GioiTinh,
        hv.Email,
        hv.DienThoai,
        hv.DiaChi,
        hv.TrangThai,
        hv.NgayNhapHoc
    `);

    res.json(result.recordset);
  } catch(err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/hocvien-lophoc/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const request = new sql.Request();
    request.input("MaHV", sql.Int, id);

    const result = await request.query(`
      SELECT 
        lh.TenLop,
        gv.TenGV,
        lh.NgayBatDau,
        lh.NgayKetThuc
      FROM DangKy dk
      JOIN LopHoc lh ON dk.MaLop = lh.MaLop
      JOIN GiaoVien gv ON lh.MaGV = gv.MaGV
      WHERE dk.MaHV = @MaHV
    `);

    res.json(result.recordset);
  } catch(err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/hocvien-lichhoc/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const request = new sql.Request();
    request.input("MaHV", sql.Int, id);

    const result = await request.query(`
      SELECT
        lh.TenLop,
        gv.TenGV,
        lich.ThuHoc,
        CONVERT(VARCHAR(5), lich.GioBatDau, 108) AS GioBatDau,
        CONVERT(VARCHAR(5), lich.GioKetThuc, 108) AS GioKetThuc
      FROM DangKy dk
      JOIN LopHoc lh ON dk.MaLop = lh.MaLop
      JOIN GiaoVien gv ON lh.MaGV = gv.MaGV
      JOIN LichHoc lich ON lh.MaLop = lich.MaLop
      WHERE dk.MaHV = @MaHV
      ORDER BY
        CASE lich.ThuHoc
          WHEN N'Thứ 2' THEN 2
          WHEN N'Thứ 3' THEN 3
          WHEN N'Thứ 4' THEN 4
          WHEN N'Thứ 5' THEN 5
          WHEN N'Thứ 6' THEN 6
          WHEN N'Thứ 7' THEN 7
          WHEN N'Chủ nhật' THEN 8
          ELSE 9
        END,
        lich.GioBatDau
    `);

    res.json(result.recordset);
  } catch(err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/hocvien-diem/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const request = new sql.Request();
    request.input("MaHV", sql.Int, id);

    const result = await request.query(`
      SELECT
        lh.TenLop,
        d.DiemThuongXuyen1,
        d.DiemThuongXuyen2,
        d.DiemGiuaKy,
        d.DiemCuoiKy,
        ROUND(
          (
            ISNULL(d.DiemThuongXuyen1, 0) +
            ISNULL(d.DiemThuongXuyen2, 0) +
            ISNULL(d.DiemGiuaKy, 0) * 2 +
            ISNULL(d.DiemCuoiKy, 0) * 3
          ) / 7.0, 2
        ) AS DiemTongKet,
        d.NhanXet
      FROM Diem d
      JOIN LopHoc lh ON d.MaLop = lh.MaLop
      WHERE d.MaHV = @MaHV
    `);

    res.json(result.recordset);
  } catch(err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/hocvien-hocphi/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const request = new sql.Request();
    request.input("MaHV", sql.Int, id);

    const result = await request.query(`
      SELECT
        lh.TenLop,
        lh.MaLop,
        hp.SoTien,
        hp.TrangThai,
        hp.NgayDong
      FROM HocPhi hp
      JOIN LopHoc lh ON hp.MaLop = lh.MaLop
      WHERE hp.MaHV = @MaHV
    `);

    res.json(result.recordset);
  } catch(err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// TRANG GIÁO VIÊN
app.get("/giaovien/:MaGV", async (req, res) => {
  try {
    const MaGV = req.params.MaGV;
    const request = new sql.Request();
    request.input("MaGV", sql.Int, MaGV);

    const result = await request.query(`
      SELECT
        gv.MaGV,
        gv.TenGV,
        gv.NgaySinh,
        gv.GioiTinh,
        gv.Email,
        gv.DienThoai,
        gv.ChuyenMon,
        gv.Luong,
        gv.TrangThai,
        COUNT(DISTINCT lh.MaLop) AS SoLopDay,
        COUNT(DISTINCT dk.MaHV) AS SoHocVien,
        COUNT(
          DISTINCT CASE
            WHEN lh.NgayKetThuc >= GETDATE()
            AND lh.NgayKetThuc <= DATEADD(day,7,GETDATE())
            THEN lh.MaLop
          END
        ) AS LopSapKetThuc
      FROM GiaoVien gv
      LEFT JOIN LopHoc lh ON gv.MaGV = lh.MaGV
      LEFT JOIN DangKy dk ON lh.MaLop = dk.MaLop
      WHERE gv.MaGV = @MaGV
      GROUP BY
        gv.MaGV,
        gv.TenGV,
        gv.NgaySinh,
        gv.GioiTinh,
        gv.Email,
        gv.DienThoai,
        gv.ChuyenMon,
        gv.Luong,
        gv.TrangThai
    `);

    res.json(result.recordset[0]);
  } catch(err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});

// LỊCH DẠY HÔM NAY
app.get("/giaovien-homnay/:MaGV", async (req, res) => {
  try {
    const thuMap = {
      0: "Chủ nhật",
      1: "Thứ 2",
      2: "Thứ 3",
      3: "Thứ 4",
      4: "Thứ 5",
      5: "Thứ 6",
      6: "Thứ 7"
    };

    const homNay = thuMap[new Date().getDay()];
    const MaGV = parseInt(req.params.MaGV);
    const request = new sql.Request();

    request.input("MaGV", sql.Int, MaGV);
    request.input("ThuHoc", sql.NVarChar, homNay);

    const result = await request.query(`
      SELECT
        lh.TenLop,
        lich.ThuHoc,
        CONVERT(VARCHAR(5), lich.GioBatDau, 108) AS GioBatDau,
        CONVERT(VARCHAR(5), lich.GioKetThuc, 108) AS GioKetThuc
      FROM LopHoc lh
      JOIN LichHoc lich ON lh.MaLop = lich.MaLop
      WHERE lh.MaGV = @MaGV
      AND lich.ThuHoc = @ThuHoc
      ORDER BY lich.GioBatDau
    `);

    res.json(result.recordset);
  } catch(err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DANH SÁCH LỚP GIÁO VIÊN DẠY
app.get("/giaovien-lophoc/:MaGV", async (req, res) => {
  try {
    const MaGV = parseInt(req.params.MaGV);
    const request = new sql.Request();
    request.input("MaGV", sql.Int, MaGV);

    const result = await request.query(`
      SELECT
        lh.MaLop,
        lh.TenLop,
        lh.NgayBatDau,
        lh.NgayKetThuc,
        lich.ThuHoc,
        CONVERT(VARCHAR(5), lich.GioBatDau, 108) AS GioBatDau,
        CONVERT(VARCHAR(5), lich.GioKetThuc, 108) AS GioKetThuc,
        COUNT(DISTINCT dk.MaHV) AS SoHocVien
      FROM LopHoc lh
      LEFT JOIN DangKy dk ON lh.MaLop = dk.MaLop
      LEFT JOIN LichHoc lich ON lh.MaLop = lich.MaLop
      WHERE lh.MaGV = @MaGV
      GROUP BY
        lh.MaLop,
        lh.TenLop,
        lh.NgayBatDau,
        lh.NgayKetThuc,
        lich.ThuHoc,
        CONVERT(VARCHAR(5), lich.GioBatDau, 108),
        CONVERT(VARCHAR(5), lich.GioKetThuc, 108)
      ORDER BY lh.TenLop
    `);

    res.json(result.recordset);
  } catch(err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DANH SÁCH HỌC VIÊN
app.get("/giaovien-hocvien/:MaGV", async (req, res) => {
  try {
    const MaGV = parseInt(req.params.MaGV);
    const request = new sql.Request();
    request.input("MaGV", sql.Int, MaGV);

    const result = await request.query(`
      SELECT
        hv.MaHV, 
        hv.TenHV, 
        hv.NgaySinh, 
        hv.GioiTinh, 
        hv.DiaChi, 
        hv.Email, 
        hv.DienThoai, 
        hv.TrangThai, 
        lh.TenLop
      FROM HocVien hv
      JOIN DangKy dk ON hv.MaHV = dk.MaHV
      JOIN LopHoc lh ON dk.MaLop = lh.MaLop
      WHERE lh.MaGV = @MaGV
      ORDER BY
        lh.TenLop,
        hv.TenHV
    `);

    res.json(result.recordset);
  } catch(err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DANH SÁCH ĐIỂM
app.get("/giaovien-diem/:MaGV", async (req, res) => {
  try {
    const MaGV = parseInt(req.params.MaGV);
    const request = new sql.Request();
    request.input("MaGV", sql.Int, MaGV);

    const result = await request.query(`
      SELECT
        ISNULL(d.MaDiem, 0) AS MaDiem,
        hv.MaHV,
        lh.MaLop,
        hv.TenHV,
        lh.TenLop,
        d.DiemThuongXuyen1,
        d.DiemThuongXuyen2,
        d.DiemGiuaKy,
        d.DiemCuoiKy,
        ROUND(
          (
            ISNULL(d.DiemThuongXuyen1, 0) +
            ISNULL(d.DiemThuongXuyen2, 0) +
            ISNULL(d.DiemGiuaKy, 0) * 2 +
            ISNULL(d.DiemCuoiKy, 0) * 3
          ) / 7.0, 2
        ) AS DiemTongKet,
        d.NhanXet
      FROM DangKy dk
      JOIN HocVien hv ON dk.MaHV = hv.MaHV
      JOIN LopHoc lh ON dk.MaLop = lh.MaLop
      LEFT JOIN Diem d ON d.MaHV = dk.MaHV AND d.MaLop = dk.MaLop
      WHERE lh.MaGV = @MaGV
      ORDER BY
        lh.TenLop,
        hv.TenHV
    `);

    res.json(result.recordset);
  } catch(err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// CẬP NHẬT ĐIỂM (AUTO TẠO DIEM NẾU CHƯA CÓ)
app.put("/capnhat-diem", async (req, res) => {
  try {
    const {
      MaDiem,
      MaHV,
      MaLop,
      DiemThuongXuyen1,
      DiemThuongXuyen2,
      DiemGiuaKy,
      DiemCuoiKy,
      NhanXet
    } = req.body;

    const request = new sql.Request();
    request.input("MaDiem", sql.Int, MaDiem || 0);
    request.input("MaHV",  sql.Int, MaHV);
    request.input("MaLop", sql.Int, MaLop);
    request.input("TX1",     sql.Float,    DiemThuongXuyen1 || null);
    request.input("TX2",     sql.Float,    DiemThuongXuyen2 || null);
    request.input("GK",      sql.Float,    DiemGiuaKy      || null);
    request.input("CK",      sql.Float,    DiemCuoiKy      || null);
    request.input("NhanXet", sql.NVarChar, NhanXet         || null);

    if (!MaDiem || MaDiem == 0) {
      // Học viên chưa có bản ghi Diem → INSERT mới
      await request.query(`
        INSERT INTO Diem (MaHV, MaLop, DiemThuongXuyen1, DiemThuongXuyen2, DiemGiuaKy, DiemCuoiKy, NhanXet)
        VALUES (@MaHV, @MaLop, @TX1, @TX2, @GK, @CK, @NhanXet)
      `);
    } else {
      // Đã có bản ghi → UPDATE
      await request.query(`
        UPDATE Diem
        SET
          DiemThuongXuyen1 = @TX1,
          DiemThuongXuyen2 = @TX2,
          DiemGiuaKy       = @GK,
          DiemCuoiKy       = @CK,
          NhanXet          = @NhanXet
        WHERE MaDiem = @MaDiem
      `);
    }

    res.json({ success: true, message: "Cập nhật điểm thành công" });
  } catch(err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});
// ĐÓNG HỌC PHÍ (HỌC VIÊN)
app.put("/hocvien-donghocphi/:MaHV/:MaLop", async (req, res) => {
  try {
    const MaHV = parseInt(req.params.MaHV);
    const MaLop = parseInt(req.params.MaLop);
    const request = new sql.Request();

    request.input("MaHV", sql.Int, MaHV);
    request.input("MaLop", sql.Int, MaLop);
    request.input("NgayDong", sql.Date, new Date());

    await request.query(`
      UPDATE HocPhi
      SET
        TrangThai = N'Đã đóng',
        NgayDong = @NgayDong
      WHERE MaHV = @MaHV
        AND MaLop = @MaLop
        AND TrangThai = N'Chưa đóng'
    `);

    res.json({ success: true, message: "Đóng học phí thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ĐỔI MẬT KHẨU
app.put("/doi-mat-khau", async (req, res) => {
  try {
    const { username, matKhauCu, matKhauMoi } = req.body;

    if (!username || !matKhauCu || !matKhauMoi) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }

    const request = new sql.Request();
    request.input("Username", sql.VarChar, username);
    request.input("MatKhauCu", sql.VarChar, matKhauCu);

    const check = await request.query(`
      SELECT Username FROM TaiKhoan
      WHERE Username = @Username AND Password = @MatKhauCu
    `);

    if (check.recordset.length === 0) {
      return res.json({ success: false, message: "Mật khẩu hiện tại không đúng" });
    }

    const request2 = new sql.Request();
    request2.input("Username", sql.VarChar, username);
    request2.input("MatKhauMoi", sql.VarChar, matKhauMoi);

    await request2.query(`
      UPDATE TaiKhoan
      SET Password = @MatKhauMoi
      WHERE Username = @Username
    `);

    res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// THÔNG BÁO
// Lấy tất cả thông báo (học viên xem)
app.get("/thongbao", async (req, res) => {
  try {
    const result = await new sql.Request().query(`
      SELECT MaTB, TieuDe, NoiDung, LoaiTB, NgayTao, GhimLen
      FROM ThongBao
      WHERE TrangThai = 1
      ORDER BY GhimLen DESC, NgayTao DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Thêm thông báo (giáo viên/admin)
app.post("/thongbao", async (req, res) => {
  try {
    const { TieuDe, NoiDung, LoaiTB, GhimLen } = req.body;
    const request = new sql.Request();
    request.input("TieuDe",  sql.NVarChar, TieuDe);
    request.input("NoiDung", sql.NVarChar, NoiDung);
    request.input("LoaiTB",  sql.NVarChar, LoaiTB || "Thông báo");
    request.input("GhimLen", sql.Bit,      GhimLen ? 1 : 0);
    await request.query(`
      INSERT INTO ThongBao (TieuDe, NoiDung, LoaiTB, GhimLen)
      VALUES (@TieuDe, @NoiDung, @LoaiTB, @GhimLen)
    `);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Xóa thông báo (ẩn)
app.delete("/thongbao/:id", async (req, res) => {
  try {
    const request = new sql.Request();
    request.input("MaTB", sql.Int, parseInt(req.params.id));
    await request.query(`UPDATE ThongBao SET TrangThai = 0 WHERE MaTB = @MaTB`);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DANH SÁCH LỚP (HỌC VIÊN ĐĂNG KÝ)
app.get("/danhsach-lop", async (req, res) => {
  try {
    const result = await new sql.Request().query(`
      SELECT
        lh.MaLop,
        lh.TenLop,
        lh.HocPhi,
        lh.NgayBatDau,
        lh.NgayKetThuc,
        lh.SoLuongToiDa,
        gv.TenGV,
        COUNT(dk.MaHV) AS SoHocVien
      FROM LopHoc lh
      JOIN GiaoVien gv ON lh.MaGV = gv.MaGV
      LEFT JOIN DangKy dk ON lh.MaLop = dk.MaLop
        AND dk.TrangThai IN (N'Đang học', N'Chờ duyệt')
      GROUP BY lh.MaLop, lh.TenLop, lh.HocPhi, lh.NgayBatDau,
               lh.NgayKetThuc, lh.SoLuongToiDa, gv.TenGV
      HAVING lh.SoLuongToiDa IS NULL
          OR COUNT(dk.MaHV) < lh.SoLuongToiDa
      ORDER BY lh.TenLop
    `);
    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ĐĂNG KÝ CỦA HỌC VIÊN
app.get("/hocvien-dangky/:MaHV", async (req, res) => {
  try {
    const request = new sql.Request();
    request.input("MaHV", sql.Int, parseInt(req.params.MaHV));
    const result = await request.query(`
      SELECT
        dk.MaDK,
        dk.MaLop,
        dk.TrangThai,
        dk.NgayDangKy,
        lh.TenLop,
        lh.HocPhi,
        gv.TenGV
      FROM DangKy dk
      JOIN LopHoc lh ON dk.MaLop = lh.MaLop
      JOIN GiaoVien gv ON lh.MaGV = gv.MaGV
      WHERE dk.MaHV = @MaHV
      ORDER BY dk.NgayDangKy DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GỬI ĐĂNG KÝ LỚP
app.post("/dangky-lop", async (req, res) => {
  try {
    const MaHV = parseInt(req.body.MaHV);
    const MaLop = parseInt(req.body.MaLop);

    if (!MaHV || !MaLop) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }

    // Kiểm tra đã đăng ký chưa — dùng request riêng
    const r1 = new sql.Request();
    r1.input("MaHV", sql.Int, MaHV);
    r1.input("MaLop", sql.Int, MaLop);
    const existing = await r1.query(`
      SELECT MaDK, TrangThai FROM DangKy
      WHERE MaHV = @MaHV AND MaLop = @MaLop
    `);

    if (existing.recordset.length > 0) {
      const tt = existing.recordset[0].TrangThai;
      if (tt === 'Chờ duyệt' || tt === 'Đang học') {
        return res.json({ success: false, message: 'Bạn đã đăng ký lớp này rồi.' });
      }
      // Bị từ chối → cho đăng ký lại
      const r2 = new sql.Request();
      r2.input("MaDK", sql.Int, existing.recordset[0].MaDK);
      await r2.query(`UPDATE DangKy SET TrangThai = N'Chờ duyệt', NgayDangKy = GETDATE() WHERE MaDK = @MaDK`);
    } else {
      // Đăng ký mới
      const r3 = new sql.Request();
      r3.input("MaHV", sql.Int, MaHV);
      r3.input("MaLop", sql.Int, MaLop);
      await r3.query(`
        INSERT INTO DangKy (MaHV, MaLop, TrangThai)
        VALUES (@MaHV, @MaLop, N'Chờ duyệt')
      `);
    }

    res.json({ success: true, message: "Đăng ký lớp thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GIÁO VIÊN XEM ĐĂNG KÝ LỚP MÌNH
app.get("/giaovien-dangky/:MaGV", async (req, res) => {
  try {
    const request = new sql.Request();
    request.input("MaGV", sql.Int, parseInt(req.params.MaGV));
    const result = await request.query(`
      SELECT
        dk.MaDK,
        dk.TrangThai,
        dk.NgayDangKy,
        hv.TenHV,
        lh.TenLop
      FROM DangKy dk
      JOIN HocVien hv ON dk.MaHV = hv.MaHV
      JOIN LopHoc lh ON dk.MaLop = lh.MaLop
      WHERE lh.MaGV = @MaGV
      ORDER BY
        CASE dk.TrangThai WHEN N'Chờ duyệt' THEN 0 ELSE 1 END,
        dk.NgayDangKy DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DUYỆT / TỪ CHỐI ĐĂNG KÝ
app.put("/duyet-dangky", async (req, res) => {
  try {
    const { MaDK, hanh } = req.body;
    const trangThai = hanh === 'duyet' ? 'Đang học' : 'Từ chối';

    const request = new sql.Request();
    request.input("MaDK", sql.Int, MaDK);
    request.input("TrangThai", sql.NVarChar, trangThai);

    await request.query(`
      UPDATE DangKy SET TrangThai = @TrangThai WHERE MaDK = @MaDK
    `);

    // Nếu duyệt → tạo bản ghi HocPhi + Diem tự động
    if (hanh === 'duyet') {
      const r2 = new sql.Request();
      r2.input("MaDK", sql.Int, MaDK);
      await r2.query(`
        INSERT INTO HocPhi (MaHV, MaLop, SoTien, TrangThai)
        SELECT dk.MaHV, dk.MaLop, lh.HocPhi, N'Chưa đóng'
        FROM DangKy dk
        JOIN LopHoc lh ON dk.MaLop = lh.MaLop
        WHERE dk.MaDK = @MaDK
          AND NOT EXISTS (
            SELECT 1 FROM HocPhi hp
            WHERE hp.MaHV = dk.MaHV AND hp.MaLop = dk.MaLop
          )
      `);

      const r3 = new sql.Request();
      r3.input("MaDK", sql.Int, MaDK);
      await r3.query(`
        INSERT INTO Diem (MaHV, MaLop)
        SELECT dk.MaHV, dk.MaLop
        FROM DangKy dk
        WHERE dk.MaDK = @MaDK
          AND NOT EXISTS (
            SELECT 1 FROM Diem d
            WHERE d.MaHV = dk.MaHV AND d.MaLop = dk.MaLop
          )
      `);
    }

    res.json({ success: true, message: "Duyệt đăng ký thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// LỊCH HỌC (ADMIN)
// Lấy lịch học theo lớp
// Toàn bộ lịch kèm tên lớp (dùng cho admin calendar view)
app.get("/lichhoc-all", async (req, res) => {
  try {
    const result = await sql.query(`
      SELECT l.MaLich, l.MaLop, l.ThuHoc,
             CONVERT(VARCHAR(5), l.GioBatDau,  108) AS GioBatDau,
             CONVERT(VARCHAR(5), l.GioKetThuc, 108) AS GioKetThuc,
             lh.TenLop, gv.TenGV,
             (SELECT COUNT(*) FROM DangKy dk WHERE dk.MaLop = l.MaLop) AS SoHocVien
      FROM LichHoc l
      JOIN LopHoc lh ON l.MaLop = lh.MaLop
      LEFT JOIN GiaoVien gv ON lh.MaGV = gv.MaGV
      ORDER BY
        CASE l.ThuHoc
          WHEN N'Thứ 2' THEN 1 WHEN N'Thứ 3' THEN 2 WHEN N'Thứ 4' THEN 3
          WHEN N'Thứ 5' THEN 4 WHEN N'Thứ 6' THEN 5 WHEN N'Thứ 7' THEN 6
          WHEN N'Chủ nhật' THEN 7 ELSE 8 END,
        l.GioBatDau
    `);
    res.json(result.recordset);
  } catch(err) { 
    console.log(err);
    res.status(500).json({ success: false, message: err.message }); 
  }
});

app.get("/lichhoc/:MaLop", async (req, res) => {
  try {
    const request = new sql.Request();
    request.input("MaLop", sql.Int, parseInt(req.params.MaLop));
    const result = await request.query(`
      SELECT
        MaLich,
        ThuHoc,
        CONVERT(VARCHAR(5), GioBatDau, 108)  AS GioBatDau,
        CONVERT(VARCHAR(5), GioKetThuc, 108) AS GioKetThuc
      FROM LichHoc
      WHERE MaLop = @MaLop
      ORDER BY
        CASE ThuHoc
          WHEN N'Thứ 2'    THEN 2
          WHEN N'Thứ 3'    THEN 3
          WHEN N'Thứ 4'    THEN 4
          WHEN N'Thứ 5'    THEN 5
          WHEN N'Thứ 6'    THEN 6
          WHEN N'Thứ 7'    THEN 7
          WHEN N'Chủ nhật' THEN 8
          ELSE 9
        END,
        GioBatDau
    `);
    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Thêm buổi học
app.post("/lichhoc", async (req, res) => {
  try {
    const { MaLop, ThuHoc, GioBatDau, GioKetThuc } = req.body;
    if (!MaLop || !ThuHoc || !GioBatDau || !GioKetThuc) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }

    // Kiểm tra trùng lịch (cùng lớp, cùng thứ, giao nhau về giờ)
    const check = new sql.Request();
    check.input("MaLop",      sql.Int,      MaLop);
    check.input("ThuHoc",     sql.NVarChar, ThuHoc);
    check.input("GioBatDau",  sql.VarChar,  GioBatDau);
    check.input("GioKetThuc", sql.VarChar,  GioKetThuc);
    const existed = await check.query(`
      SELECT COUNT(*) AS SoLuong FROM LichHoc
      WHERE MaLop   = @MaLop
        AND ThuHoc  = @ThuHoc
        AND GioBatDau  < CAST(@GioKetThuc AS TIME)
        AND GioKetThuc > CAST(@GioBatDau  AS TIME)
    `);
    if (existed.recordset[0].SoLuong > 0) {
      return res.json({ success: false, message: "Lớp này đã có lịch học trùng khung giờ trong ngày đó." });
    }

    const request = new sql.Request();
    request.input("MaLop",      sql.Int,      MaLop);
    request.input("ThuHoc",     sql.NVarChar, ThuHoc);
    request.input("GioBatDau",  sql.VarChar,  GioBatDau);
    request.input("GioKetThuc", sql.VarChar,  GioKetThuc);
    await request.query(`
      INSERT INTO LichHoc (MaLop, ThuHoc, GioBatDau, GioKetThuc)
      VALUES (@MaLop, @ThuHoc, CAST(@GioBatDau AS TIME), CAST(@GioKetThuc AS TIME))
    `);
    res.json({ success: true, message: "Thêm lịch học thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Xóa buổi học
app.delete("/lichhoc/:MaLich", async (req, res) => {
  try {
    const request = new sql.Request();
    request.input("MaLich", sql.Int, parseInt(req.params.MaLich));
    await request.query(`DELETE FROM LichHoc WHERE MaLich = @MaLich`);
    res.json({ success: true, message: "Xóa lịch học thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// TÀI KHOẢN (ADMIN)
// Lấy danh sách tài khoản (không trả password)
app.get("/taikhoan", async (req, res) => {
  try {
    const result = await new sql.Request().query(`
      SELECT Username, Role, MaGV, MaHV
      FROM TaiKhoan
      ORDER BY
        CASE Role
          WHEN 'admin'    THEN 1
          WHEN 'giaovien' THEN 2
          ELSE 3
        END,
        Username
    `);
    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Thêm tài khoản
app.post("/taikhoan", async (req, res) => {
  try {
    const { Username, Password, Role, MaGV, MaHV } = req.body;
    if (!Username || !Password || !Role) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }

    // Kiểm tra username đã tồn tại chưa
    const check = new sql.Request();
    check.input("Username", sql.VarChar, Username);
    const existed = await check.query(`SELECT COUNT(*) AS SoLuong FROM TaiKhoan WHERE Username = @Username`);
    if (existed.recordset[0].SoLuong > 0) {
      return res.json({ success: false, message: "Username này đã tồn tại." });
    }

    const request = new sql.Request();
    request.input("Username", sql.VarChar,  Username);
    request.input("Password", sql.VarChar,  Password);
    request.input("Role",     sql.VarChar,  Role);
    request.input("MaGV",     sql.Int,      MaGV ? parseInt(MaGV) : null);
    request.input("MaHV",     sql.Int,      MaHV ? parseInt(MaHV) : null);
    await request.query(`
      INSERT INTO TaiKhoan (Username, Password, Role, MaGV, MaHV)
      VALUES (@Username, @Password, @Role, @MaGV, @MaHV)
    `);
    res.json({ success: true, message: "Tạo tài khoản thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Đặt lại mật khẩu (admin reset MK của bất kỳ tài khoản nào)
app.put("/taikhoan-reset", async (req, res) => {
  try {
    const { Username, Password } = req.body;
    if (!Username || !Password) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin." });
    }
    const request = new sql.Request();
    request.input("Username", sql.VarChar, Username);
    request.input("Password", sql.VarChar, Password);
    await request.query(`
      UPDATE TaiKhoan SET Password = @Password WHERE Username = @Username
    `);
    res.json({ success: true, message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Xóa tài khoản
app.delete("/taikhoan/:username", async (req, res) => {
  try {
    const request = new sql.Request();
    request.input("Username", sql.VarChar, req.params.username);
    await request.query(`DELETE FROM TaiKhoan WHERE Username = @Username`);
    res.json({ success: true, message: "Xóa tài khoản thành công" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Full data lọc theo giáo viên
app.get("/full-giaovien/:MaGV", async (req, res) => {
  try {
    const request = new sql.Request();
    request.input("MaGV", sql.Int, parseInt(req.params.MaGV));
    const result = await request.query(`
      SELECT
        HocVien.MaHV, HocVien.TenHV, HocVien.TrangThai,
        LopHoc.MaLop, LopHoc.TenLop,
        GiaoVien.MaGV, GiaoVien.TenGV,
        Diem.MaDiem,
        Diem.DiemThuongXuyen1, Diem.DiemThuongXuyen2,
        Diem.DiemGiuaKy, Diem.DiemCuoiKy,
        ROUND(
          (
            ISNULL(Diem.DiemThuongXuyen1, 0) +
            ISNULL(Diem.DiemThuongXuyen2, 0) +
            ISNULL(Diem.DiemGiuaKy, 0) * 2 +
            ISNULL(Diem.DiemCuoiKy, 0) * 3
          ) / 7.0, 2
        ) AS DiemTongKet,
        HocPhi.TrangThai AS TrangThaiHP
      FROM LopHoc
      LEFT JOIN GiaoVien ON LopHoc.MaGV = GiaoVien.MaGV
      LEFT JOIN DangKy   ON LopHoc.MaLop = DangKy.MaLop
      LEFT JOIN HocVien  ON DangKy.MaHV = HocVien.MaHV
      LEFT JOIN Diem     ON Diem.MaHV = HocVien.MaHV AND Diem.MaLop = LopHoc.MaLop
      LEFT JOIN HocPhi   ON HocPhi.MaHV = HocVien.MaHV AND HocPhi.MaLop = LopHoc.MaLop
      WHERE LopHoc.MaGV = @MaGV
      ORDER BY LopHoc.MaLop, HocVien.TenHV
    `);
    res.json(result.recordset);
  } catch(err) { 
    console.log(err);
    res.status(500).json({ success: false, message: err.message }); 
  }
});

// THỐNG KÊ
app.get("/thongke", async (req, res) => {
  try {
    const r1 = await new sql.Request().query(`
      SELECT TrangThai, COUNT(*) AS SoLuong
      FROM HocVien 
      WHERE TrangThai IS NOT NULL
      GROUP BY TrangThai
    `);
    
    const r2 = await new sql.Request().query(`
      SELECT lh.MaLop, lh.TenLop,
        ROUND(AVG(
          (
            ISNULL(d.DiemThuongXuyen1, 0) +
            ISNULL(d.DiemThuongXuyen2, 0) +
            ISNULL(d.DiemGiuaKy, 0) * 2 +
            ISNULL(d.DiemCuoiKy, 0) * 3
          ) / 7.0
        ), 2) AS DiemTB,
        COUNT(d.MaDiem) AS SoHV
      FROM LopHoc lh
      LEFT JOIN Diem d ON d.MaLop = lh.MaLop
      GROUP BY lh.MaLop, lh.TenLop
      ORDER BY lh.MaLop
    `);
    
    const r3 = await new sql.Request().query(`
      SELECT TenGV, ISNULL(Luong, 0) AS Luong
      FROM GiaoVien 
      ORDER BY Luong DESC
    `);
    
    const r4 = await new sql.Request().query(`
      SELECT lh.MaLop, lh.TenLop,
        SUM(CASE WHEN hp.TrangThai = N'Đã đóng'   THEN 1 ELSE 0 END) AS DaDong,
        SUM(CASE WHEN hp.TrangThai = N'Chưa đóng' THEN 1 ELSE 0 END) AS ChuaDong
      FROM LopHoc lh
      LEFT JOIN HocPhi hp ON hp.MaLop = lh.MaLop
      GROUP BY lh.MaLop, lh.TenLop
      ORDER BY lh.MaLop
    `);
    
    res.json({
      trangThaiHV: r1.recordset,
      diemTBTheoLop: r2.recordset,
      luongGV: r3.recordset,
      hocPhiTheoLop: r4.recordset
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});