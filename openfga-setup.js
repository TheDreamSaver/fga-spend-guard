#!/usr/bin/env node

/**
 * OpenFGA Setup Script for SmartSpend
 * 
 * This script handles the complete setup of OpenFGA for the SmartSpend application:
 * 1. Creates the authorization model
 * 2. Writes initial relationships (tuples)
 * 3. Tests the setup
 * 
 * Usage:
 *   node openfga-setup.js                    # Run complete setup
 *   node openfga-setup.js --model-only       # Only create the model
 *   node openfga-setup.js --tuples-only      # Only write tuples
 *   node openfga-setup.js --test-only        # Only test relationships
 */

// OpenFGA Configuration
const OPENFGA_CONFIG = {
  apiUrl: 'https://api.playground-us1.fga.dev',
  storeId: '01K3ET2XTM439ZP4B55FXEX854',
  authorizationModelId: '01K3ET34FPYBA428XBF0B91SNN'
};

// OpenFGA Authorization Model with proper manager hierarchy inheritance
const AUTHORIZATION_MODEL = {
  "schema_version": "1.1",
  "type_definitions": [
    {
      "type": "user",
      "relations": {
        "can_manage": {
          "union": {
            "child": [
              {
                "this": {}
              },
              {
                "computed_userset": {
                  "relation": "manager"
                }
              }
            ]
          }
        },
        "manager": {
          "union": {
            "child": [
              {
                "this": {}
              }
            ]
          }
        }
      }
    },
    {
      "type": "department",
      "relations": {
        "finance_auditor": {
          "union": {
            "child": [
              {
                "this": {}
              }
            ]
          }
        },
        "member": {
          "union": {
            "child": [
              {
                "this": {}
              }
            ]
          }
        }
      }
    },
    {
      "type": "expense",
      "relations": {
        "can_approve": {
          "union": {
            "child": [
              {
                "computed_userset": {
                  "relation": "can_manage"
                }
              }
            ]
          }
        },
        "can_view": {
          "union": {
            "child": [
              {
                "this": {}
              },
              {
                "computed_userset": {
                  "relation": "can_manage"
                }
              },
              {
                "tuple_to_userset": {
                  "tupleset": {
                    "object": {
                      "type": "expense"
                    },
                    "relation": "department"
                  },
                  "computed_userset": {
                    "relation": "finance_auditor"
                  }
                }
              }
            ]
          }
        },
        "department": {
          "union": {
            "child": [
              {
                "this": {}
              }
            ]
          }
        },
        "owner": {
          "union": {
            "child": [
              {
                "this": {}
              }
            ]
          }
        }
      }
    }
  ]
};

// Updated relationships that properly implement manager hierarchy inheritance
const INITIAL_RELATIONSHIPS = [
  // Department memberships
  { user: "user:dina_dev", relation: "member", object: "department:engineering" },
  { user: "user:raj_manager", relation: "member", object: "department:engineering" },
  { user: "user:chen_vp", relation: "member", object: "department:engineering" },
  { user: "user:frank_finance", relation: "member", object: "department:finance" },
  
  // Finance auditor for both departments
  { user: "user:frank_finance", relation: "finance_auditor", object: "department:engineering" },
  { user: "user:frank_finance", relation: "finance_auditor", object: "department:finance" },
  
  // Manager hierarchy: Chen VP -> Raj Manager -> Dina Dev
  { user: "user:chen_vp", relation: "manager", object: "user:raj_manager" },
  { user: "user:raj_manager", relation: "manager", object: "user:dina_dev" },
  
  // Expenses with proper ownership and department assignment
  { user: "user:dina_dev", relation: "owner", object: "expense:exp_101" },
  { user: "user:dina_dev", relation: "owner", object: "expense:exp_102" },
  { user: "user:raj_manager", relation: "owner", object: "expense:exp_201" },
  { user: "user:chen_vp", relation: "owner", object: "expense:exp_301" },
  { user: "user:frank_finance", relation: "owner", object: "expense:exp_401" },
  
  // Expense departments
  { user: "department:engineering", relation: "department", object: "expense:exp_101" },
  { user: "department:engineering", relation: "department", object: "expense:exp_102" },
  { user: "department:engineering", relation: "department", object: "expense:exp_201" },
  { user: "department:engineering", relation: "department", object: "expense:exp_301" },
  { user: "department:finance", relation: "department", object: "expense:exp_401" }
];

// Updated test cases for the new model
const TEST_CASES = [
  // Dina Dev - can only see her own expenses
  { user: "user:dina_dev", relation: "can_view", object: "expense:exp_101", expected: true },
  { user: "user:dina_dev", relation: "can_view", object: "expense:exp_102", expected: true },
  { user: "user:dina_dev", relation: "can_view", object: "expense:exp_201", expected: false },
  { user: "user:dina_dev", relation: "can_view", object: "expense:exp_301", expected: false },
  { user: "user:dina_dev", relation: "can_view", object: "expense:exp_401", expected: false },
  
  // Dina Dev - cannot approve any expenses
  { user: "user:dina_dev", relation: "can_approve", object: "expense:exp_101", expected: false },
  { user: "user:dina_dev", relation: "can_approve", object: "expense:exp_102", expected: false },
  
  // Raj Manager - can see his own expenses and Dina's expenses (he manages her)
  { user: "user:raj_manager", relation: "can_view", object: "expense:exp_101", expected: true },
  { user: "user:raj_manager", relation: "can_view", object: "expense:exp_102", expected: true },
  { user: "user:raj_manager", relation: "can_view", object: "expense:exp_201", expected: true },
  { user: "user:raj_manager", relation: "can_view", object: "expense:exp_301", expected: false },
  { user: "user:raj_manager", relation: "can_view", object: "expense:exp_401", expected: false },
  
  // Raj Manager - can approve Dina's expenses (he manages her)
  { user: "user:raj_manager", relation: "can_approve", object: "expense:exp_101", expected: true },
  { user: "user:raj_manager", relation: "can_approve", object: "expense:exp_102", expected: true },
  { user: "user:raj_manager", relation: "can_approve", object: "expense:exp_201", expected: false },
  
  // Chen VP - can see all engineering expenses (he manages Raj, who manages Dina)
  { user: "user:chen_vp", relation: "can_view", object: "expense:exp_101", expected: true },
  { user: "user:chen_vp", relation: "can_view", object: "expense:exp_102", expected: true },
  { user: "user:chen_vp", relation: "can_view", object: "expense:exp_201", expected: true },
  { user: "user:chen_vp", relation: "can_view", object: "expense:exp_301", expected: true },
  { user: "user:chen_vp", relation: "can_view", object: "expense:exp_401", expected: false },
  
  // Chen VP - can approve Raj's and Dina's expenses (he manages Raj, who manages Dina)
  { user: "user:chen_vp", relation: "can_approve", object: "expense:exp_101", expected: true },
  { user: "user:chen_vp", relation: "can_approve", object: "expense:exp_102", expected: true },
  { user: "user:chen_vp", relation: "can_approve", object: "expense:exp_201", expected: true },
  { user: "user:chen_vp", relation: "can_approve", object: "expense:exp_301", expected: false },
  
  // Frank Finance - can see all expenses (finance auditor for both departments)
  { user: "user:frank_finance", relation: "can_view", object: "expense:exp_101", expected: true },
  { user: "user:frank_finance", relation: "can_view", object: "expense:exp_102", expected: true },
  { user: "user:frank_finance", relation: "can_view", object: "expense:exp_201", expected: true },
  { user: "user:frank_finance", relation: "can_view", object: "expense:exp_301", expected: true },
  { user: "user:frank_finance", relation: "can_view", object: "expense:exp_401", expected: true },
  
  // Frank Finance - cannot approve any expenses (not a manager)
  { user: "user:frank_finance", relation: "can_approve", object: "expense:exp_101", expected: false },
  { user: "user:frank_finance", relation: "can_approve", object: "expense:exp_102", expected: false },
  { user: "user:frank_finance", relation: "can_approve", object: "expense:exp_201", expected: false },
  { user: "user:frank_finance", relation: "can_approve", object: "expense:exp_301", expected: false },
  { user: "user:frank_finance", relation: "can_approve", object: "expense:exp_401", expected: false }
];

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

async function makeRequest(url, options) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// Core functions
async function checkOpenFGAHealth() {
  log('Checking OpenFGA playground health...');
  try {
    await makeRequest(`${OPENFGA_CONFIG.apiUrl}/healthz`);
    log('OpenFGA playground is healthy', 'success');
    return true;
  } catch (error) {
    log(`OpenFGA playground health check failed: ${error.message}`, 'error');
    return false;
  }
}

async function verifyStoreAccess() {
  log('Verifying store access...');
  try {
    await makeRequest(`${OPENFGA_CONFIG.apiUrl}/stores/${OPENFGA_CONFIG.storeId}`);
    log('Store access verified', 'success');
    return true;
  } catch (error) {
    log(`Store access failed: ${error.message}`, 'error');
    return false;
  }
}

async function createAuthorizationModel() {
  log('Creating authorization model...');
  try {
    const data = await makeRequest(`${OPENFGA_CONFIG.apiUrl}/stores/${OPENFGA_CONFIG.storeId}/authorization-models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(AUTHORIZATION_MODEL)
    });
    
    log(`Authorization model created with ID: ${data.authorization_model_id}`, 'success');
    return data.authorization_model_id;
  } catch (error) {
    if (error.message.includes('409')) {
      log('Authorization model already exists, using existing model', 'warning');
      return OPENFGA_CONFIG.authorizationModelId;
    }
    throw error;
  }
}

async function writeTuples(authorizationModelId) {
  log('Writing initial relationships...');
  
  const batchSize = 5;
  const batches = [];
  for (let i = 0; i < INITIAL_RELATIONSHIPS.length; i += batchSize) {
    batches.push(INITIAL_RELATIONSHIPS.slice(i, i + batchSize));
  }

  log(`Writing ${INITIAL_RELATIONSHIPS.length} initial relationships...`);
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    log(`Writing batch ${i + 1}/${batches.length}...`);
    
    try {
      await makeRequest(`${OPENFGA_CONFIG.apiUrl}/stores/${OPENFGA_CONFIG.storeId}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization_model_id: authorizationModelId,
          writes: {
            tuple_keys: batch.map(rel => ({
              user: rel.user,
              relation: rel.relation,
              object: rel.object
            }))
          }
        })
      });
      log(`Batch ${i + 1} written successfully`, 'success');
    } catch (error) {
      // If it's a "tuple already exists" error, we can ignore it
      if (error.message.includes('already exists')) {
        log(`Batch ${i + 1} skipped (tuples already exist)`, 'warning');
      } else {
        log(`Failed to write batch ${i + 1}: ${error.message}`, 'error');
        throw error;
      }
    }
  }
  
  log('All relationships written successfully', 'success');
}

async function testRelationships(authorizationModelId) {
  log('Testing authorization relationships...');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of TEST_CASES) {
    try {
      const result = await makeRequest(`${OPENFGA_CONFIG.apiUrl}/stores/${OPENFGA_CONFIG.storeId}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization_model_id: authorizationModelId,
          tuple_key: {
            user: testCase.user,
            relation: testCase.relation,
            object: testCase.object
          }
        })
      });
      
      const actual = result.allowed;
      const expected = testCase.expected;
      const status = actual === expected ? 'PASS' : 'FAIL';
      
      if (actual === expected) {
        passed++;
        log(`${status}: ${testCase.description || 'Test case'}`, 'success');
      } else {
        failed++;
        log(`${status}: ${testCase.description || 'Test case'} (expected ${expected}, got ${actual})`, 'error');
      }
    } catch (error) {
      failed++;
      log(`ERROR: ${testCase.description || 'Test case'} - ${error.message}`, 'error');
    }
  }
  
  log(`Tests completed: ${passed} passed, ${failed} failed`, failed === 0 ? 'success' : 'warning');
  return failed === 0;
}

async function deleteAllTuples(authorizationModelId) {
  log('Deleting all existing relationships...');
  
  // First, let's read all existing tuples to delete them
  try {
    const response = await makeRequest(`${OPENFGA_CONFIG.apiUrl}/stores/${OPENFGA_CONFIG.storeId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorization_model_id: authorizationModelId
      })
    });
    
    if (response.tuples && response.tuples.length > 0) {
      const deleteResponse = await makeRequest(`${OPENFGA_CONFIG.apiUrl}/stores/${OPENFGA_CONFIG.storeId}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization_model_id: authorizationModelId,
          deletes: {
            tuple_keys: response.tuples.map(tuple => ({
              user: tuple.key.user,
              relation: tuple.key.relation,
              object: tuple.key.object
            }))
          }
        })
      });
      log(`Deleted ${response.tuples.length} existing relationships`, 'success');
    } else {
      log('No existing relationships to delete', 'info');
    }
  } catch (error) {
    log(`Error deleting existing relationships: ${error.message}`, 'warning');
  }
}

// Main execution
async function main() {
  log('🚀 SmartSpend OpenFGA Setup Script');
  
  // Determine mode
  const mode = process.argv[2];
  if (mode === '--model-only') {
    log('Mode: --model-only');
  } else if (mode === '--tuples-only') {
    log('Mode: --tuples-only');
  } else if (mode === '--test-only') {
    log('Mode: --test-only');
  } else {
    log('Mode: full setup');
  }
  
  log(`API URL: ${OPENFGA_CONFIG.apiUrl}`);
  log(`Store ID: ${OPENFGA_CONFIG.storeId}`);
  
  try {
    // Check OpenFGA health
    const isHealthy = await checkOpenFGAHealth();
    if (!isHealthy) {
      throw new Error('OpenFGA playground is not accessible');
    }
    
    // Verify store access
    await verifyStoreAccess();
    
    let authorizationModelId = OPENFGA_CONFIG.authorizationModelId;
    
    if (mode === '--test-only') {
      await testRelationships(authorizationModelId);
      return;
    }
    
    // Create authorization model only if not in tuples-only mode
    if (mode !== '--tuples-only') {
      authorizationModelId = await createAuthorizationModel();
    }
    
    if (mode === '--model-only') {
      log('Model creation completed', 'success');
      return;
    }
    
    // Delete all existing tuples and recreate from scratch
    await deleteAllTuples(authorizationModelId);
    
    // Write initial relationships
    await writeTuples(authorizationModelId);
    
    if (mode === '--tuples-only') {
      log('Tuples creation completed', 'success');
      return;
    }
    
    // Test relationships
    await testRelationships(authorizationModelId);
    
    log('🎉 OpenFGA setup completed successfully!', 'success');
    
  } catch (error) {
    log(`Setup failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the script
main();

// Export for potential use as a module
export {
  OPENFGA_CONFIG,
  AUTHORIZATION_MODEL,
  INITIAL_RELATIONSHIPS,
  TEST_CASES
}; 