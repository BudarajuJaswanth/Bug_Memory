import json
import urllib.request
import urllib.error
import time
import sys
import uuid

# Configure stdout and stderr to use UTF-8 on Windows to prevent UnicodeEncodeError
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def make_request(method, path, data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    req_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        res_body = e.read().decode("utf-8")
        try:
            err_data = json.loads(res_body)
        except Exception:
            err_data = res_body
        return e.code, err_data
    except Exception as e:
        return 0, str(e)

def run_tests():
    print("Starting Bug Memory Backend API Tests...")
    
    # 1. POST /api/projects
    project_name = f"test_project_{int(time.time())}"
    print(f"\n1. Creating project: {project_name}")
    status, res = make_request("POST", "/api/projects", {"name": project_name})
    print(f"Status: {status}, Response: {res}")
    if status not in [200, 201]:
        print("Failed to create project")
        sys.exit(1)
        
    # 2. GET /api/projects
    print("\n2. Getting projects list")
    status, res = make_request("GET", "/api/projects")
    print(f"Status: {status}, Response: {res}")
    
    # 3. POST /api/bugs (manual log)
    print("\n3. Logging a manual bug")
    bug_payload = {
        "project": project_name,
        "error": "NullPointerException: Attempt to invoke virtual method on a null object reference",
        "root_cause": "The object instance 'data_provider' was not initialized before use in main activity.",
        "fix": "Initialize 'data_provider = DataProvider()' in onCreate() before calling loadData().",
        "file": "MainActivity.java",
        "tags": ["java", "nullpointer", "lifecycle"]
    }
    status, res = make_request("POST", "/api/bugs", bug_payload)
    print(f"Status: {status}, Response: {res}")
    if status not in [200, 201]:
        print("Failed to log bug")
        sys.exit(1)
        
    # 4. POST /api/bugs/recall (memory hit test with polling)
    print("\n4. Polling recall for the known bug (expecting 'memory' hit)")
    max_wait = 15
    poll_interval = 2
    elapsed = 0
    status, res = 0, {}
    while elapsed < max_wait:
        session_id_4 = str(uuid.uuid4())
        recall_payload = {
            "project": project_name,
            "error_text": "NullPointerException on data_provider",
            "session_id": session_id_4
        }
        status, res = make_request("POST", "/api/bugs/recall", recall_payload)
        if status == 200 and res.get("source") == "memory":
            print(f"Success: Indexed in memory after {elapsed}s.")
            break
        print(f"[{elapsed}s] Not in memory yet. Retrying...")
        time.sleep(poll_interval)
        elapsed += poll_interval

    if status != 200 or res.get("source") != "memory":
        print(f"Error: Ingestion/indexing failed to complete within {max_wait}s. Recall status: {status}, Response: {res}")
        sys.exit(1)
        
    print(f"Status: {status}, Response: {res}")
    
    # 5. POST /api/bugs/recall (expecting AI fallback)
    session_id_5 = str(uuid.uuid4())
    print(f"\n5. Testing recall for an unknown bug (expecting 'ai_suggested', session_id={session_id_5})")
    recall_payload_new = {
        "project": project_name,
        "error_text": "DivisionByZeroError: division by zero in calculator.py on line 42",
        "session_id": session_id_5
    }
    status, res = make_request("POST", "/api/bugs/recall", recall_payload_new)
    print(f"Status: {status}, Response: {res}")
    
    if status == 200 and res.get("source") == "ai_suggested":
        # 6. Confirm-fix loop test
        print(f"\n6. Confirming AI suggested fix to reinforce it (session_id={session_id_5})")
        results = res.get("results", [])
        if results:
            root_cause = results[0].get("root_cause")
            fix = results[0].get("fix")
            confirm_payload = {
                "session_id": session_id_5,
                "source": "ai_suggested",
                "project": project_name,
                "error": "DivisionByZeroError: division by zero in calculator.py on line 42",
                "root_cause": root_cause,
                "fix": fix,
                "file": "calculator.py",
                "tags": ["python", "math"]
            }
            status_cf, res_cf = make_request("POST", "/api/bugs/confirm-fix", confirm_payload)
            print(f"Confirm-fix Status: {status_cf}, Response: {res_cf}")
            
            # 7. Verify it is now in memory by recalling again (with polling)
            print("\n7. Polling recall for the division by zero bug again (expecting 'memory' hit now)")
            elapsed = 0
            status_re, res_re = 0, {}
            while elapsed < max_wait:
                session_id_7 = str(uuid.uuid4())
                recall_payload_verify = {
                    "project": project_name,
                    "error_text": "DivisionByZeroError: division by zero in calculator.py on line 42",
                    "session_id": session_id_7
                }
                status_re, res_re = make_request("POST", "/api/bugs/recall", recall_payload_verify)
                if status_re == 200 and res_re.get("source") == "memory":
                    print(f"Success: AI suggestion reinforced in memory after {elapsed}s.")
                    break
                print(f"[{elapsed}s] Not in memory yet. Retrying...")
                time.sleep(poll_interval)
                elapsed += poll_interval

            if status_re != 200 or res_re.get("source") != "memory":
                print(f"Error: Ingestion/reinforcement failed to complete within {max_wait}s. Recall status: {status_re}, Response: {res_re}")
                sys.exit(1)

            print(f"Recall again Status: {status_re}, Response: {res_re}")

    # 8. GET /api/projects/{name}/graph
    print("\n8. Getting project graph")
    status, res = make_request("GET", f"/api/projects/{project_name}/graph")
    print(f"Status: {status}, Response: {res}")

    # 9. DELETE /api/projects
    print(f"\n9. Deleting project: {project_name}")
    status, res = make_request("DELETE", f"/api/projects/{project_name}")
    print(f"Status: {status}, Response: {res}")

if __name__ == "__main__":
    run_tests()
