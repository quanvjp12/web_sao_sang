CREATE DATABASE TrungTam;
GO
USE TrungTam;

CREATE TABLE HocVien (
    MaHV INT IDENTITY(1,1) PRIMARY KEY,
    TenHV NVARCHAR(100) NOT NULL,
    NgaySinh DATE,
    GioiTinh NVARCHAR(10),
    DiaChi NVARCHAR(255),
    DienThoai NVARCHAR(15),
    Email NVARCHAR(100),
    NgayNhapHoc DATE DEFAULT GETDATE(),
    TrangThai NVARCHAR(50) DEFAULT N'Đang học'
);

CREATE TABLE GiaoVien (
    MaGV INT IDENTITY(1,1) PRIMARY KEY,
    TenGV NVARCHAR(100) NOT NULL,
    NgaySinh DATE,
    GioiTinh NVARCHAR(10),
    DienThoai NVARCHAR(15),
    Email NVARCHAR(100),
    ChuyenMon NVARCHAR(100),
    Luong DECIMAL(10,2),
    TrangThai NVARCHAR(50) DEFAULT N'Đang dạy'
);

CREATE TABLE LopHoc (
    MaLop INT IDENTITY(1,1) PRIMARY KEY,
    TenLop NVARCHAR(100) NOT NULL,
    MoTa NVARCHAR(255),
    HocPhi DECIMAL(10,2),
    SoLuongToiDa INT,
    NgayBatDau DATE,
    NgayKetThuc DATE,
    LichHoc NVARCHAR(100),
    MaGV INT,
    FOREIGN KEY (MaGV) REFERENCES GiaoVien(MaGV)
);

CREATE TABLE DangKy (
    MaDK INT IDENTITY(1,1) PRIMARY KEY,
    MaHV INT,
    MaLop INT,
    NgayDangKy DATE DEFAULT GETDATE(),
    TrangThai NVARCHAR(50) DEFAULT N'Đang học',
    FOREIGN KEY (MaHV) REFERENCES HocVien(MaHV),
    FOREIGN KEY (MaLop) REFERENCES LopHoc(MaLop)
);

CREATE TABLE Diem (
    MaDiem INT IDENTITY(1,1) PRIMARY KEY,
    MaHV INT,
    MaLop INT,
	DiemThuongXuyen1 FLOAT,
	DiemThuongXuyen2 FLOAT,
    DiemGiuaKy FLOAT,
    DiemCuoiKy FLOAT,
    DiemTongKet AS (
        (ISNULL(DiemThuongXuyen1,0) + ISNULL(DiemThuongXuyen2,0) +
         ISNULL(DiemGiuaKy,0)*2 + ISNULL(DiemCuoiKy,0)*3) / 7),
    NhanXet NVARCHAR(255),
    FOREIGN KEY (MaHV) REFERENCES HocVien(MaHV),
    FOREIGN KEY (MaLop) REFERENCES LopHoc(MaLop)
);

CREATE TABLE HocPhi (
    MaHP INT IDENTITY(1,1) PRIMARY KEY,
    MaHV INT,
    MaLop INT,
    SoTien DECIMAL(10,2),
    NgayDong DATE,
    TrangThai NVARCHAR(50) DEFAULT N'Chưa đóng',
    FOREIGN KEY (MaHV) REFERENCES HocVien(MaHV),
    FOREIGN KEY (MaLop) REFERENCES LopHoc(MaLop)
);

CREATE TABLE TaiKhoan(
    Username VARCHAR(50) PRIMARY KEY,
    Password VARCHAR(50) NOT NULL,
    Role VARCHAR(20) NOT NULL CHECK (Role IN ('admin', 'giaovien', 'hocvien')),
    MaGV INT NULL,
    MaHV INT NULL
);

CREATE TABLE LichHoc(
    MaLich INT PRIMARY KEY IDENTITY(1,1),
    MaLop INT NOT NULL,
    ThuHoc NVARCHAR(20) NOT NULL,
    GioBatDau TIME NOT NULL,
    GioKetThuc TIME NOT NULL,
    FOREIGN KEY (MaLop)
    REFERENCES LopHoc(MaLop)
);
