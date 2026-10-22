// Copyright 2026 Custom Browser contributors. MIT license.
#ifndef UI_GFX_WIN_CUSTOM_BROWSER_FONT_DIRECTORY_H_
#define UI_GFX_WIN_CUSTOM_BROWSER_FONT_DIRECTORY_H_
#include <windows.h>
#include <dwrite_3.h>
#include <wrl/client.h>
#include <algorithm>
#include <cstdint>
#include <optional>
#include <string>
#include <vector>

namespace custom_browser {
// Local fixed-drive, nonrecursive collections, bounded before DirectWrite reads.
inline std::optional<std::vector<std::wstring>> ReadFontDirectory(
    const std::wstring& directory) {
  if (directory.size() < 3 || directory[1] != L':' ||
      (directory[2] != L'\\' && directory[2] != L'/') ||
      directory.find(L'\0') != std::wstring::npos) return std::nullopt;
  std::wstring root = directory;
  std::replace(root.begin(), root.end(), L'/', L'\\');
  if (root.find(L"\\..\\") != std::wstring::npos || root.ends_with(L"\\..") ||
      GetDriveTypeW(root.substr(0, 3).c_str()) != DRIVE_FIXED)
    return std::nullopt;
  // Reject reparse points in every existing path component, not only the leaf.
  for (size_t end = 3; end <= root.size(); ++end) {
    if (end != root.size() && root[end] != L'\\') continue;
    const DWORD attributes = GetFileAttributesW(root.substr(0, end).c_str());
    if (attributes == INVALID_FILE_ATTRIBUTES ||
        !(attributes & FILE_ATTRIBUTE_DIRECTORY) ||
        (attributes & FILE_ATTRIBUTE_REPARSE_POINT)) return std::nullopt;
  }
  WIN32_FIND_DATAW entry{};
  const HANDLE raw = FindFirstFileW((root + L"\\*").c_str(), &entry);
  if (raw == INVALID_HANDLE_VALUE) return std::nullopt;
  struct FindHandle {
    HANDLE value;
    ~FindHandle() { FindClose(value); }
  } handle{raw};
  std::vector<std::wstring> files;
  uint64_t total = 0;
  do {
    if (entry.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) continue;
    const std::wstring name(entry.cFileName);
    const size_t dot = name.find_last_of(L'.');
    if (dot == std::wstring::npos) continue;
    const std::wstring extension = name.substr(dot);
    if (_wcsicmp(extension.c_str(), L".ttf") && _wcsicmp(extension.c_str(), L".otf") &&
        _wcsicmp(extension.c_str(), L".ttc")) continue;
    const uint64_t size = (static_cast<uint64_t>(entry.nFileSizeHigh) << 32) |
                          entry.nFileSizeLow;
    total += size;
    if ((entry.dwFileAttributes & FILE_ATTRIBUTE_REPARSE_POINT) || !size ||
        size > 64ull * 1024 * 1024 || total > 512ull * 1024 * 1024 ||
        files.size() >= 256) return std::nullopt;
    files.push_back(root + L"\\" + name);
  } while (FindNextFileW(handle.value, &entry));
  if (GetLastError() != ERROR_NO_MORE_FILES || files.empty()) return std::nullopt;
  std::sort(files.begin(), files.end());
  Microsoft::WRL::ComPtr<IUnknown> unknown;
  if (FAILED(DWriteCreateFactory(DWRITE_FACTORY_TYPE_ISOLATED,
                                __uuidof(IDWriteFactory3), &unknown)))
    return std::nullopt;
  Microsoft::WRL::ComPtr<IDWriteFactory3> factory;
  if (FAILED(unknown.As(&factory))) return std::nullopt;
  for (const auto& path : files) {
    Microsoft::WRL::ComPtr<IDWriteFontFile> file;
    if (FAILED(factory->CreateFontFileReference(path.c_str(), nullptr, &file)))
      return std::nullopt;
    BOOL supported = FALSE;
    DWRITE_FONT_FILE_TYPE type{};
    UINT32 faces = 0;
    if (FAILED(file->Analyze(&supported, &type, nullptr, &faces)) ||
        !supported || !faces || faces > 64) return std::nullopt;
  }
  return files;
}
}  // namespace custom_browser
#endif
