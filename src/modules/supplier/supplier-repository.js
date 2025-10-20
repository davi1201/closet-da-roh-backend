import Supplier from './supplier-model.js';

class SupplierRepository {
  async create(supplierData) {
    const newSupplier = new Supplier(supplierData);
    return await newSupplier.save();
  }

  async findById(id) {
    return await Supplier.findById(id).lean();
  }

  async findByDocument(documentNumber) {
    if (!documentNumber || documentNumber.trim() === '') {
      return null;
    }
    return await Supplier.findOne({ document_number: documentNumber }).lean();
  }

  async findAll(onlyActive = true) {
    const query = onlyActive ? { is_active: true } : {};
    return await Supplier.find(query).sort({ name: 1 }).lean();
  }

  async update(id, updateData) {
    return await Supplier.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();
  }

  async deactivate(id) {
    return await this.update(id, { is_active: false });
  }
}

export default new SupplierRepository();
