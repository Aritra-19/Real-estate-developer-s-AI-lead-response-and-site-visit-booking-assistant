import os
import zipfile

def package_submission():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    zip_path = os.path.join(root_dir, 'submission.zip')

    files_to_pack = [
        ('Technical_Design_Document.docx', os.path.join(root_dir, 'Technical_Design_Document.docx')),
        ('deployment.md', os.path.join(root_dir, 'deployment.md')),
        ('Technical_Design_Document.md', os.path.join(root_dir, 'Technical_Design_Document.md'))
    ]

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for arcname, filepath in files_to_pack:
            if os.path.exists(filepath):
                zipf.write(filepath, arcname)
                print(f"[PACKED] Added {arcname} ({os.path.getsize(filepath)} bytes)")
            else:
                print(f"[MISSING] Warning: {filepath} does not exist!")

    print(f"\n[COMPLETE] Created submission zip: {zip_path} ({os.path.getsize(zip_path)} bytes)")

if __name__ == '__main__':
    package_submission()
