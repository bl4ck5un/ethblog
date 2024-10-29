import sys
print("PROOFREAD THE FOLLOWING:")
print("-"*20)

print(open(sys.argv[1]).read())

print("DEPLOY THE FOLLOWING:")
print("-"*20)

print(repr(open(sys.argv[1]).read().strip())[1:-1])
