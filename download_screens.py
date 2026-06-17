import urllib.request
import os

screens = [
    {
        "title": "Shop Details Table View Desktop",
        "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzFjYjg1ZTY5Mjg2MjRiZmI4NWI3ZDg5ZjQ0NjNjNjkyEgsSBxCgu7-L8BUYAZIBIgoKcHJvamVjdF9pZBIUQhI2MzEyODIzMTYyMzE1NjE3MDc&filename=&opi=89354086",
        "filename": "shop_details_table_desktop.html"
    },
    {
        "title": "Add New Shop Modal Manual Entry Mobile",
        "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sX2ZhMjAzYzg2YmY1ZjQwNTU5YmQ4NDliZmUzMjI5OTYxEgsSBxCgu7-L8BUYAZIBIgoKcHJvamVjdF9pZBIUQhI2MzEyODIzMTYyMzE1NjE3MDc&filename=&opi=89354086",
        "filename": "add_shop_modal_mobile.html"
    },
    {
        "title": "Add Edit Post Modal Desktop",
        "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzAwMDY1M2NhNGEwNDQ1MTAwNjM5NzBhMmEzMjhlMGUwEgsSBxCgu7-L8BUYAZIBIgoKcHJvamVjdF9pZBIUQhI2MzEyODIzMTYyMzE1NjE3MDc&filename=&opi=89354086",
        "filename": "add_edit_post_modal_desktop.html"
    },
    {
        "title": "Shops Directory Desktop",
        "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzAyMmM5ZGRlMjUzMDRlNmQ5OWVlNDRlZjc2MmI0MzU1EgsSBxCgu7-L8BUYAZIBIgoKcHJvamVjdF9pZBIUQhI2MzEyODIzMTYyMzE1NjE3MDc&filename=&opi=89354086",
        "filename": "shops_directory_desktop.html"
    },
    {
        "title": "Dashboard Overview",
        "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzAwMDY1M2NhMzMwYjJhMDMwMzc0OTk3Y2Q0MDJiNTVlEgsSBxCgu7-L8BUYAZIBIgoKcHJvamVjdF9pZBIUQhI2MzEyODIzMTYyMzE1NjE3MDc&filename=&opi=89354086",
        "filename": "dashboard_overview.html"
    },
    {
        "title": "Calendar Date Details Table View Desktop",
        "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzc1OGM3ZDZjODYxZTQ2MWFiYmJhMzQzYzJlNmE5OWI4EgsSBxCgu7-L8BUYAZIBIgoKcHJvamVjdF9pZBIUQhI2MzEyODIzMTYyMzE1NjE3MDc&filename=&opi=89354086",
        "filename": "calendar_date_details_desktop.html"
    },
    {
        "title": "Shop Details Calendar View Desktop",
        "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzhjYjgxMTVlOTdiYjQxN2VhZWNkNDc3OGNhMzJhZDRhEgsSBxCgu7-L8BUYAZIBIgoKcHJvamVjdF9pZBIUQhI2MzEyODIzMTYyMzE1NjE3MDc&filename=&opi=89354086",
        "filename": "shop_details_calendar_desktop.html"
    }
]

out_dir = r"C:\Users\abian\.gemini\antigravity-ide\scratch\social-media-tracker\design_screens"
os.makedirs(out_dir, exist_ok=True)

for screen in screens:
    filename = os.path.join(out_dir, screen["filename"])
    print(f"Downloading {screen['title']} to {filename}...")
    try:
        urllib.request.urlretrieve(screen["url"], filename)
        print("Success")
    except Exception as e:
        print(f"Failed: {e}")
